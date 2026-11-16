"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const app = express();
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const passwordRecord = process.env.ADMIN_PASSWORD_SCRYPT || "";
const sessionSecret = process.env.SESSION_SECRET || "";
const intakeToken = process.env.RECOVERY_INTAKE_TOKEN || "";
const dataKeyHex = process.env.RECOVERY_DATA_KEY || "";
const dbPath = path.resolve(process.env.RECOVERY_DB_PATH || path.join(__dirname, "data", "recovery-requests.sqlite"));
let recoveryDb = null;
if (/^[a-f0-9]{64}$/i.test(dataKeyHex)) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true, mode: 0o700 });
  recoveryDb = new DatabaseSync(dbPath, { timeout: 5000 });
  recoveryDb.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  recoveryDb.exec(`CREATE TABLE IF NOT EXISTS recovery_requests (
    id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    status TEXT NOT NULL, encrypted_payload TEXT NOT NULL, admin_note TEXT NOT NULL DEFAULT '',
    epic_reference TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS recovery_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, request_id TEXT NOT NULL, event_type TEXT NOT NULL,
    actor TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
    FOREIGN KEY(request_id) REFERENCES recovery_requests(id) ON DELETE CASCADE
  );`);
  try { fs.chmodSync(dbPath, 0o600); } catch (_) {}
}
if (!adminEmail || !passwordRecord.includes(":") || sessionSecret.length < 32) {
  console.error("Set ADMIN_EMAIL, ADMIN_PASSWORD_SCRYPT (salt:hex scrypt hash), and SESSION_SECRET (32+ chars).");
  process.exit(1);
}
if (production) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      workerSrc: ["'self'", "blob:", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: "32kb" }));
app.use("/api", (req, res, next) => {
  res.set({ "Cache-Control": "no-store", "Pragma": "no-cache" });
  next();
});

const sessionDbPath = path.resolve(process.env.RECOVERY_SESSION_DB_PATH || path.join(__dirname, "data", "panel-sessions.sqlite"));
fs.mkdirSync(path.dirname(sessionDbPath), { recursive: true, mode: 0o700 });
const sessionDb = new DatabaseSync(sessionDbPath, { timeout: 5000 });
sessionDb.exec("PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS panel_sessions (sid TEXT PRIMARY KEY, session_json TEXT NOT NULL, expires_at INTEGER NOT NULL);");
try { fs.chmodSync(sessionDbPath, 0o600); } catch (_) {}

class PersistentSqliteSessionStore extends session.Store {
  constructor(db) { super(); this.db = db; }
  expiry(sessionData) {
    const cookie = sessionData?.cookie || {};
    const expires = cookie.expires ? new Date(cookie.expires).getTime() : Date.now() + Number(cookie.maxAge || 7200000);
    return Number.isFinite(expires) ? expires : Date.now() + 7200000;
  }
  get(sid, callback) {
    try {
      const row = this.db.prepare("SELECT session_json, expires_at FROM panel_sessions WHERE sid = ?").get(sid);
      if (!row) return callback(null, null);
      if (row.expires_at <= Date.now()) {
        this.db.prepare("DELETE FROM panel_sessions WHERE sid = ?").run(sid);
        return callback(null, null);
      }
      return callback(null, JSON.parse(row.session_json));
    } catch (error) { return callback(error); }
  }
  set(sid, sessionData, callback = () => {}) {
    try {
      const expiresAt = this.expiry(sessionData);
      this.db.prepare("INSERT INTO panel_sessions (sid, session_json, expires_at) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET session_json=excluded.session_json, expires_at=excluded.expires_at")
        .run(sid, JSON.stringify(sessionData), expiresAt);
      this.db.prepare("DELETE FROM panel_sessions WHERE expires_at <= ?").run(Date.now());
      callback(null);
    } catch (error) { callback(error); }
  }
  touch(sid, sessionData, callback = () => {}) {
    try {
      this.db.prepare("UPDATE panel_sessions SET expires_at = ? WHERE sid = ?").run(this.expiry(sessionData), sid);
      callback(null);
    } catch (error) { callback(error); }
  }
  destroy(sid, callback = () => {}) {
    try { this.db.prepare("DELETE FROM panel_sessions WHERE sid = ?").run(sid); callback(null); }
    catch (error) { callback(error); }
  }
  clear(callback = () => {}) {
    try { this.db.prepare("DELETE FROM panel_sessions").run(); callback(null); }
    catch (error) { callback(error); }
  }
  length(callback) {
    try { callback(null, Number(this.db.prepare("SELECT COUNT(*) AS count FROM panel_sessions WHERE expires_at > ?").get(Date.now()).count)); }
    catch (error) { callback(error); }
  }
}
app.use(session({
  name: "recovery_panel_sid", secret: sessionSecret, store: new PersistentSqliteSessionStore(sessionDb),
  resave: false, saveUninitialized: false, rolling: false,
  cookie: { httpOnly: true, sameSite: "strict", secure: production, maxAge: 2 * 60 * 60 * 1000 }
}));
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false });
const intakeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: "draft-7", legacyHeaders: false });
const allowedIntakeFields = new Set(["accountId","display","oldDisplay","email","oldEmail","firstName","lastName","country","incident","error","date","firstSeen","details","mfaAccess","twoStepMethods","connectedAccounts","linked","appeal","platform","platformId","caseId","noticeDate","requestedOutcome","changeRequestType","requestedEmail","requestedUsername","requestedDisplayName"]);
function encryptPayload(value) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(dataKeyHex, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}
function decryptPayload(value) {
  const [ivHex, tagHex, dataHex] = String(value).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(dataKeyHex, "hex"), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8"));
}
function cleanIntakePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid recovery details.");
  const secretAssignment = /(?:password|passwd|cookie|session(?:[_ -]?(?:id|token))?|access[_ -]?token|refresh[_ -]?token|authorization|2fa|backup[_ -]?code|verification[_ -]?code|one[_ -]?time[_ -]?code|authenticator[_ -]?secret|private[_ -]?key|cvv|card[_ -]?number)\s*[:=]\s*\S+/i;
  const bearerCredential = /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}/i;
  const unknown = Object.keys(input).filter(key => !allowedIntakeFields.has(key));
  if (unknown.length) throw new Error("Unsupported recovery field(s): " + unknown.join(", "));
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "twoStepMethods") {
      if (!Array.isArray(value) || value.length > 8 || value.some(v => typeof v !== "string" || v.length > 80)) throw new Error("Invalid recovery-method list.");
      output[key] = [...new Set(value.map(v => v.trim()).filter(Boolean))];
    } else if (key === "connectedAccounts") {
      if (!Array.isArray(value) || value.length > 12) throw new Error("Connected accounts must be a list of at most 12 entries.");
      output[key] = value.map(item => {
        if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).some(k => !["platform","username","publicId"].includes(k))) throw new Error("Connected-account entries may contain only platform, username, and public ID.");
        const clean = {};
        for (const k of ["platform","username","publicId"]) {
          const v = item[k] ?? "";
          if (typeof v !== "string" || v.length > 120) throw new Error("A connected-account field is invalid or too long.");
          clean[k] = v.trim();
        }
        if (!clean.platform || (!clean.username && !clean.publicId)) throw new Error("Each connected account needs a platform and a username or public ID.");
        return clean;
      });
    } else {
      if (typeof value !== "string" || value.length > (key === "details" || key === "appeal" ? 3000 : 500)) throw new Error("A recovery field is too long or invalid.");
      if (secretAssignment.test(value) || bearerCredential.test(value)) throw new Error("Do not include passwords, cookies, session values, tokens, verification codes, or other login secrets in recovery notes.");
      output[key] = value.trim();
    }
  }
  if (!output.accountId && !output.display && !output.email && !output.oldEmail) throw new Error("Provide at least an account ID, display name, or account email.");
  return output;
}
function safeEqual(a,b) { const x=Buffer.from(String(a)), y=Buffer.from(String(b)); return x.length===y.length && crypto.timingSafeEqual(x,y); }
function validPassword(candidate) {
  const p=passwordRecord.split(":"); if(p.length!==2 || !/^[a-f0-9]{32}$/i.test(p[0]) || !/^[a-f0-9]{128}$/i.test(p[1])) return false;
  return safeEqual(crypto.scryptSync(String(candidate),p[0],64).toString("hex"),p[1].toLowerCase());
}
async function notify(event) {
  const hook=process.env.DISCORD_WEBHOOK_URL; if(!hook) return;
  try { const u=new URL(hook); if(u.protocol!=="https:" || u.hostname!=="discord.com" || !u.pathname.startsWith("/api/webhooks/")) return;
    await fetch(hook,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({content:"Recovery Assistant panel: "+event})});
  } catch (_) {}
}
function auth(req,res,next){ if(req.session && req.session.authenticated===true) return next(); res.status(401).json({error:"Please sign in to the Recovery Assistant panel."}); }
app.post("/api/intake", intakeLimiter, (req,res) => {
  if (!recoveryDb || intakeToken.length < 32) return res.status(503).json({error:"Recovery intake is not configured. Contact the panel administrator."});
  if (!safeEqual(String(req.headers.authorization || ""), "Bearer " + intakeToken)) return res.status(401).json({error:"Intake service authentication failed."});
  if (req.body?.consent !== true || String(req.body?.website || "").trim()) return res.status(400).json({error:"Submission consent is required and automated submissions are not accepted."});
  let payload;
  try { payload = cleanIntakePayload(req.body.payload); } catch (e) { return res.status(400).json({error:e.message}); }
  const now = new Date().toISOString(), id = crypto.randomUUID();
  const reference = "RR-" + now.slice(0,10).replace(/-/g,"") + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  try {
    recoveryDb.prepare("INSERT INTO recovery_requests (id,reference,created_at,updated_at,status,encrypted_payload) VALUES (?,?,?,?,?,?)")
      .run(id,reference,now,now,"pending-review",encryptPayload(payload));
    recoveryDb.prepare("INSERT INTO recovery_events (request_id,event_type,actor,note,created_at) VALUES (?,?,?,?,?)")
      .run(id,"submitted","customer","New request received for administrator review.",now);
    return res.status(201).json({ok:true,reference,status:"pending-review",message:"Your request was received for administrator review. This does not submit it to Epic."});
  } catch (e) { console.error("Recovery intake save failed:",e.message); return res.status(500).json({error:"The recovery request could not be saved. Please try again later."}); }
});
app.get("/api/recovery-requests", auth, (req,res) => {
  if (!recoveryDb) return res.status(503).json({error:"Encrypted recovery database is not configured."});
  const rows = recoveryDb.prepare("SELECT id,reference,created_at,updated_at,status,epic_reference,submitted_at FROM recovery_requests ORDER BY created_at DESC LIMIT 500").all();
  const counts = recoveryDb.prepare("SELECT status,COUNT(*) AS count FROM recovery_requests GROUP BY status").all();
  res.set("Cache-Control","no-store").json({requests:rows,counts,configured:true});
});
app.get("/api/recovery-requests/:id", auth, (req,res) => {
  if (!recoveryDb) return res.status(503).json({error:"Encrypted recovery database is not configured."});
  const row = recoveryDb.prepare("SELECT * FROM recovery_requests WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({error:"Recovery request not found."});
  let payload; try { payload = decryptPayload(row.encrypted_payload); } catch (_) { return res.status(500).json({error:"This request could not be decrypted. Check the configured data key."}); }
  const events = recoveryDb.prepare("SELECT event_type,actor,note,created_at FROM recovery_events WHERE request_id=? ORDER BY id DESC").all(row.id);
  res.set("Cache-Control","no-store").json({request:{id:row.id,reference:row.reference,created_at:row.created_at,updated_at:row.updated_at,status:row.status,payload,admin_note:row.admin_note,epic_reference:row.epic_reference,submitted_at:row.submitted_at,events}});
});
app.get("/api/recovery-requests/:id/export", auth, (req,res) => {
  if (!recoveryDb) return res.status(503).json({error:"Encrypted recovery database is not configured."});
  const row = recoveryDb.prepare("SELECT * FROM recovery_requests WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({error:"Recovery request not found."});
  if (!["approved","submitted-to-epic","waiting-for-epic","resolved"].includes(row.status)) return res.status(409).json({error:"Only approved recovery records can be exported."});
  let payload;
  try { payload = decryptPayload(row.encrypted_payload); } catch (_) { return res.status(500).json({error:"This request could not be decrypted. Check the configured data key."}); }
  const now = new Date().toISOString();
  recoveryDb.prepare("INSERT INTO recovery_events (request_id,event_type,actor,note,created_at) VALUES (?,?,?,?,?)")
    .run(row.id,"approved-record-exported",req.session.adminEmail || "administrator","Approved recovery record exported as JSON.",now);
  const events = recoveryDb.prepare("SELECT event_type,actor,note,created_at FROM recovery_events WHERE request_id=? ORDER BY id").all(row.id);
  res.set({"Cache-Control":"no-store","Pragma":"no-cache","Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="recovery-'+row.reference+'.json"'});
  return res.send(JSON.stringify({reference:row.reference,status:row.status,created_at:row.created_at,updated_at:row.updated_at,epic_reference:row.epic_reference,submitted_at:row.submitted_at,payload,events,exported_at:now},null,2));
});
app.patch("/api/recovery-requests/:id", auth, (req,res) => {
  if (!recoveryDb) return res.status(503).json({error:"Encrypted recovery database is not configured."});
  const row = recoveryDb.prepare("SELECT * FROM recovery_requests WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({error:"Recovery request not found."});
  const statuses = new Set(["needs-information","approved","rejected","submitted-to-epic","waiting-for-epic","resolved"]);
  const unknownPatchFields = Object.keys(req.body || {}).filter(key => !["status","admin_note","epic_reference"].includes(key));
  if (unknownPatchFields.length) return res.status(400).json({error:"Unsupported review field(s): " + unknownPatchFields.join(", ")});
  const status = String(req.body?.status || "");
  if (req.body?.admin_note !== undefined && (typeof req.body.admin_note !== "string" || req.body.admin_note.length > 2000)) return res.status(400).json({error:"Administrator notes must be text no longer than 2,000 characters."});
  if (req.body?.epic_reference !== undefined && (typeof req.body.epic_reference !== "string" || req.body.epic_reference.length > 120)) return res.status(400).json({error:"The Epic reference must be text no longer than 120 characters."});
  const note = req.body?.admin_note === undefined ? row.admin_note : req.body.admin_note.trim();
  const epicReference = req.body?.epic_reference === undefined ? row.epic_reference : req.body.epic_reference.trim();
  if (!statuses.has(status)) return res.status(400).json({error:"Choose a valid review status."});
  if (status === "needs-information" && !["pending-review","needs-information"].includes(row.status)) return res.status(409).json({error:"Only a pending request can be moved to needs-information."});
  if (status === "approved" && !["pending-review","needs-information","approved"].includes(row.status)) return res.status(409).json({error:"Only a pending request can be approved."});
  if (status === "rejected" && !["pending-review","needs-information","approved","rejected"].includes(row.status)) return res.status(409).json({error:"This request can no longer be rejected from its current status."});
  if (status === "submitted-to-epic" && row.status !== "approved" && row.status !== "submitted-to-epic") return res.status(409).json({error:"Approve the request before recording an Epic submission."});
  if (status === "waiting-for-epic" && row.status !== "submitted-to-epic" && row.status !== "waiting-for-epic") return res.status(409).json({error:"Record the official submission before marking it as waiting for Epic."});
  if (status === "resolved" && !["submitted-to-epic","waiting-for-epic","resolved"].includes(row.status)) return res.status(409).json({error:"Record the official submission before resolving this request."});
  if (status === "submitted-to-epic" && !epicReference) return res.status(400).json({error:"Enter the official Epic recovery reference after you submit it."});
  const now = new Date().toISOString(), submittedAt = status === "submitted-to-epic" ? (row.submitted_at || now) : row.submitted_at;
  recoveryDb.prepare("UPDATE recovery_requests SET updated_at=?,status=?,admin_note=?,epic_reference=?,submitted_at=? WHERE id=?").run(now,status,note,epicReference,submittedAt,row.id);
  recoveryDb.prepare("INSERT INTO recovery_events (request_id,event_type,actor,note,created_at) VALUES (?,?,?,?,?)").run(row.id,status,req.session.adminEmail || "administrator",note || "Status updated by administrator.",now);
  res.json({ok:true,status,updated_at:now});
});
app.post("/api/login",loginLimiter,(req,res,next)=>{
  const email=String(req.body?.email||"").trim().toLowerCase(), password=String(req.body?.password||"");
  const emailMatches=safeEqual(email,adminEmail);
  let passwordMatches=false;
  try { passwordMatches=validPassword(password); } catch (_) {}
  if(!emailMatches||!passwordMatches){notify("unsuccessful panel sign-in attempt");return res.status(401).json({error:"Sign-in failed. Check your panel email and password."});}
  req.session.regenerate(err=>{if(err)return next(err);req.session.authenticated=true;req.session.adminEmail=email;req.session.save(err2=>{if(err2)return next(err2);notify("panel sign-in successful");res.json({ok:true});});});
});
app.get("/api/session",(req,res)=>res.json({authenticated:!!(req.session&&req.session.authenticated)}));
app.post("/api/logout",auth,(req,res)=>req.session.destroy(()=>{res.clearCookie("recovery_panel_sid",{httpOnly:true,sameSite:"strict",secure:production});notify("panel sign-out");res.json({ok:true});}));
app.post("/api/client-error",auth,(req,res)=>{notify("a general dashboard error occurred");res.json({ok:true});});
app.use(express.static(path.join(__dirname,"public"),{index:false,etag:true,maxAge:production?"1h":0}));
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,req,res,next)=>{console.error("Panel server error:",err?.message||"unknown");if(res.headersSent)return next(err);res.status(500).json({error:"A server error occurred. Check server logs; no account data is sent to Discord."});});
app.listen(port,()=>{console.log("Recovery Assistant panel listening on port "+port);console.log("Use HTTPS when exposing this panel to the internet.");console.log("Persistent SQLite administrator sessions enabled.");});
