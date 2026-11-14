"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("node:crypto");
const path = require("node:path");
const app = express();
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const passwordRecord = process.env.ADMIN_PASSWORD_SCRYPT || "";
const sessionSecret = process.env.SESSION_SECRET || "";
if (!adminEmail || !passwordRecord.includes(":") || sessionSecret.length < 32) {
  console.error("Set ADMIN_EMAIL, ADMIN_PASSWORD_SCRYPT (salt:hex scrypt hash), and SESSION_SECRET (32+ chars).");
  process.exit(1);
}
if (production) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use(session({
  name: "recovery_panel_sid", secret: sessionSecret, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "strict", secure: production, maxAge: 2 * 60 * 60 * 1000 }
}));
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false });
function safeEqual(a,b) { const x=Buffer.from(String(a)), y=Buffer.from(String(b)); return x.length===y.length && crypto.timingSafeEqual(x,y); }
function validPassword(candidate) {
  const p=passwordRecord.split(":"); if(p.length!==2 || !/^[a-f0-9]{128}$/i.test(p[1])) return false;
  return safeEqual(crypto.scryptSync(String(candidate),p[0],64).toString("hex"),p[1].toLowerCase());
}
async function notify(event) {
  const hook=process.env.DISCORD_WEBHOOK_URL; if(!hook) return;
  try { const u=new URL(hook); if(u.protocol!=="https:" || u.hostname!=="discord.com" || !u.pathname.startsWith("/api/webhooks/")) return;
    await fetch(hook,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({content:"Recovery Assistant panel: "+event})});
  } catch (_) {}
}
function auth(req,res,next){ if(req.session && req.session.authenticated===true) return next(); res.status(401).json({error:"Please sign in to the Recovery Assistant panel."}); }
app.post("/api/login",loginLimiter,(req,res,next)=>{
  const email=String(req.body?.email||"").trim().toLowerCase(), password=String(req.body?.password||"");
  if(!safeEqual(email,adminEmail)||!validPassword(password)){notify("unsuccessful panel sign-in attempt");return res.status(401).json({error:"Sign-in failed. Check your panel email and password."});}
  req.session.regenerate(err=>{if(err)return next(err);req.session.authenticated=true;req.session.save(err2=>{if(err2)return next(err2);notify("panel sign-in successful");res.json({ok:true});});});
});
app.get("/api/session",(req,res)=>res.json({authenticated:!!(req.session&&req.session.authenticated)}));
app.post("/api/logout",auth,(req,res)=>req.session.destroy(()=>{res.clearCookie("recovery_panel_sid",{httpOnly:true,sameSite:"strict",secure:production});notify("panel sign-out");res.json({ok:true});}));
app.post("/api/client-error",auth,(req,res)=>{notify("a general dashboard error occurred");res.json({ok:true});});
app.use(express.static(path.join(__dirname,"public"),{index:false,etag:true,maxAge:production?"1h":0}));
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use((err,req,res,next)=>{console.error("Panel server error:",err?.message||"unknown");if(res.headersSent)return next(err);res.status(500).json({error:"A server error occurred. Check server logs; no account data is sent to Discord."});});
app.listen(port,()=>{console.log("Recovery Assistant panel listening on port "+port);console.log("Use HTTPS when exposing this panel to the internet.");if(production)console.warn("Replace MemoryStore with a persistent secure session store before production use.");});
