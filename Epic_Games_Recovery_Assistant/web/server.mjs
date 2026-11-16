import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { timingSafeEqual, createHash, createHmac, randomBytes, scryptSync } from "node:crypto";

const ROOT = process.env.WEB_ROOT || process.cwd();
const PORT = Number(process.env.PORT || 8080);
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const CHAT_PASSWORD = process.env.CHAT_ACCESS_PASSWORD || "";
const DASHBOARD_USERS_FILE = process.env.DASHBOARD_USERS_FILE || path.join(ROOT, ".dashboard-users.json");
let registrationInProgress = false;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
const RECOVERY_PANEL_INTAKE_URL = process.env.RECOVERY_PANEL_INTAKE_URL || "";
const RECOVERY_PANEL_URL = process.env.RECOVERY_PANEL_URL || "";
const RECOVERY_INTAKE_TOKEN = process.env.RECOVERY_INTAKE_TOKEN || "";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const TELEGRAM_CONFIGURED = Boolean(TELEGRAM_BOT_TOKEN && /^[A-Za-z0-9_]{5,32}$/.test(TELEGRAM_BOT_USERNAME));
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/login.html", ["login.html", "text/html; charset=utf-8"]],
  ["/project-downloads.html", ["project-downloads.html", "text/html; charset=utf-8"]],
  ["/network_security.js", ["network_security.js", "text/javascript; charset=utf-8"]],
  ["/network-tools.html", ["network-tools.html", "text/html; charset=utf-8"]],
  ["/network-lab.html", ["network-lab.html", "text/html; charset=utf-8"]],
  ["/server-network-lab.html", ["server-network-lab.html", "text/html; charset=utf-8"]],
  ["/discord-server-dashboard/", ["../../DISCORD-SERVER-DASHBOARD/index.html", "text/html; charset=utf-8"]],
  ["/discord-server-dashboard", ["../../DISCORD-SERVER-DASHBOARD/index.html", "text/html; charset=utf-8"]],
  ["/discord-server-dashboard/index.html", ["../../DISCORD-SERVER-DASHBOARD/index.html", "text/html; charset=utf-8"]],
  ["/discord-server-dashboard/dashboard.css", ["../../DISCORD-SERVER-DASHBOARD/dashboard.css", "text/css; charset=utf-8"]],
  ["/discord-server-dashboard/dashboard.js", ["../../DISCORD-SERVER-DASHBOARD/dashboard.js", "text/javascript; charset=utf-8"]],
  ["/discord-server-dashboard/bot-builder.html", ["../../DISCORD-SERVER-DASHBOARD/bot-builder.html", "text/html; charset=utf-8"]],
  ["/discord-server-dashboard/cpp-bot/main.cpp", ["../../DISCORD-SERVER-DASHBOARD/cpp-bot/main.cpp", "text/plain; charset=utf-8"]],
  ["/discord-server-dashboard/cpp-bot/CMakeLists.txt", ["../../DISCORD-SERVER-DASHBOARD/cpp-bot/CMakeLists.txt", "text/plain; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/network-tools.html", ["network-tools.html", "text/html; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/network-lab.html", ["network-lab.html", "text/html; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/server-network-lab.html", ["server-network-lab.html", "text/html; charset=utf-8"]],
  ["/workspace-controls.js", ["workspace-controls.js", "text/javascript; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/workspace-controls.js", ["workspace-controls.js", "text/javascript; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/SETUP_AND_USAGE.txt", ["SETUP_AND_USAGE.txt", "text/plain; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/network_security_snapshot.ps1", ["network_security_snapshot.ps1", "text/plain; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/project_vulnerability_audit.ps1", ["project_vulnerability_audit.ps1", "text/plain; charset=utf-8"]],
  ["/Epic_Games_Recovery_Assistant/web/network_tools.ps1", ["network_tools.ps1", "text/plain; charset=utf-8"]],
  ["/network_tools.ps1", ["network_tools.ps1", "text/plain; charset=utf-8"]],
  ["/network_security_snapshot.ps1", ["network_security_snapshot.ps1", "text/plain; charset=utf-8"]],
  ["/project_vulnerability_audit.ps1", ["project_vulnerability_audit.ps1", "text/plain; charset=utf-8"]],
  ["/ghostface-bg.jpg", ["ghostface-bg.jpg", "image/jpeg"]],
  ["/SETUP_AND_USAGE.txt", ["SETUP_AND_USAGE.txt", "text/plain; charset=utf-8"]],
  ["/FAZE_JARVIS_SETUP.md", ["FAZE_JARVIS_SETUP.md", "text/markdown; charset=utf-8"]],
  ["/TELEGRAM_FORTNITE_SETUP.md", ["TELEGRAM_FORTNITE_SETUP.md", "text/markdown; charset=utf-8"]]
]);
const limits = new Map();
const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(body));
};
function sameSecret(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
}
function allowedRate(ip) {
  const now = Date.now(), old = limits.get(ip) || [];
  const recent = old.filter(t => now - t < 60000);
  if (recent.length >= 10) { limits.set(ip, recent); return false; }
  recent.push(now); limits.set(ip, recent);
  if (limits.size > 2000) for (const [key, times] of limits) if (!times.some(t => now - t < 60000)) limits.delete(key);
  return true;
}
function getSessionId(req) {
  const cookie = String(req.headers.cookie || "");
  const match = cookie.match(/(?:^|;\s*)dashboard_session=([a-f0-9]{64})(?:;|$)/);
  return match ? match[1] : "";
}
function hasDashboardSession(req) {
  const id = getSessionId(req);
  const expires = sessions.get(id);
  if (!id || !expires) return false;
  if (expires <= Date.now()) { sessions.delete(id); return false; }
  sessions.set(id, Date.now() + SESSION_TTL_MS);
  return true;
}
function sessionCookie(id, maxAge = SESSION_TTL_MS / 1000) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return "dashboard_session=" + id + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + maxAge + secure;
}
async function readDashboardUsers() {
  try {
    const parsed = JSON.parse(await readFile(DASHBOARD_USERS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.filter(user => user && typeof user.username === "string" && typeof user.salt === "string" && typeof user.passwordHash === "string") : [];
  } catch (error) { if (error.code === "ENOENT") return []; throw error; }
}
function passwordHash(password, salt) { return scryptSync(password, salt, 64).toString("hex"); }
async function saveDashboardUser(username, password) {
  const salt = randomBytes(16).toString("hex");
  const user = { username, salt, passwordHash: passwordHash(password, salt), createdAt: new Date().toISOString() };
  await mkdir(path.dirname(DASHBOARD_USERS_FILE), { recursive: true });
  await writeFile(DASHBOARD_USERS_FILE, JSON.stringify([user], null, 2), { encoding: "utf8", mode: 0o600, flag: "wx" });
  return user;
}
async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 32768) throw new Error("Request too large");
  }
  return JSON.parse(body || "{}");
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origin !== "http://" + req.headers.host && origin !== "https://" + req.headers.host) {
    return json(res, 403, { error: "Cross-origin requests are not allowed." });
  }
  const url = new URL(req.url || "/", "http://localhost");
  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    return res.end("ok\n");
  }

  if (req.method === "GET" && url.pathname === "/api/auth/status") {
    try { const users = await readDashboardUsers(); return json(res, 200, { registrationAvailable: users.length === 0 }); }
    catch { return json(res, 500, { error: "Dashboard account storage could not be read." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    if (!allowedRate("dashboard-register:" + (req.socket.remoteAddress || "unknown"))) return json(res, 429, { error: "Too many registration attempts. Wait a minute and try again." });
    if (registrationInProgress) return json(res, 409, { error: "Initial account registration is already in progress." });
    registrationInProgress = true;
    try {
      const users = await readDashboardUsers();
      if (users.length) return json(res, 403, { error: "Registration is closed because the first dashboard account already exists." });
      let input; try { input = await readBody(req); } catch { return json(res, 400, { error: "Enter a valid username and password." }); }
      if (!input || typeof input.username !== "string" || typeof input.password !== "string") return json(res, 400, { error: "Enter a valid username and password." });
      const username = input.username.trim();
      if (!/^[^\u0000-\u001f\u007f]{3,64}$/.test(username)) return json(res, 400, { error: "Username must be 3–64 characters and cannot contain control characters." });
      if (input.password.length < 12 || input.password.length > 256) return json(res, 400, { error: "Password must be at least 12 characters and no more than 256 characters." });
      try { await saveDashboardUser(username, input.password); }
      catch (error) { if (error.code === "EEXIST") return json(res, 403, { error: "A dashboard account has already been registered." }); throw error; }
      const id = randomBytes(32).toString("hex"); sessions.set(id, Date.now() + SESSION_TTL_MS);
      res.writeHead(201, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": sessionCookie(id), "X-Content-Type-Options": "nosniff" });
      return res.end(JSON.stringify({ registered: true, authenticated: true }));
    } catch { return json(res, 500, { error: "Could not create the dashboard account. Check the server's writable data folder." }); }
    finally { registrationInProgress = false; }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    if (!allowedRate("dashboard-login:" + (req.socket.remoteAddress || "unknown"))) return json(res, 429, { error: "Too many sign-in attempts. Wait a minute and try again." });
    let input; try { input = await readBody(req); } catch { return json(res, 400, { error: "Enter a valid username and password." }); }
    if (!input || typeof input.username !== "string" || typeof input.password !== "string") return json(res, 400, { error: "Enter a valid username and password." });
    let users; try { users = await readDashboardUsers(); } catch { return json(res, 500, { error: "Dashboard account storage could not be read." }); }
    const user = users.find(item => item.username.toLowerCase() === input.username.trim().toLowerCase());
    const salt = user ? user.salt : "0".repeat(32);
    const expected = user ? user.passwordHash : "0".repeat(128);
    if (!user || !sameSecret(passwordHash(input.password, salt), expected)) return json(res, 401, { error: "The username or password is incorrect." });
    const id = randomBytes(32).toString("hex"); sessions.set(id, Date.now() + SESSION_TTL_MS);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": sessionCookie(id), "X-Content-Type-Options": "nosniff" });
    return res.end(JSON.stringify({ authenticated: true }));
  }
  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const id = getSessionId(req);
    if (id) sessions.delete(id);
    res.writeHead(303, { "Location": "/login.html", "Cache-Control": "no-store", "Set-Cookie": sessionCookie("", 0), "X-Content-Type-Options": "nosniff" });
    return res.end();
  }
  if (req.method === "GET" && url.pathname === "/login.html") {
    // Login page is intentionally public; all dashboard content requires a session.
  } else if (!hasDashboardSession(req)) {
    if (url.pathname.startsWith("/api/")) return json(res, 401, { error: "Sign in to the dashboard to continue." });
    res.writeHead(303, { "Location": "/login.html", "Cache-Control": "no-store" });
    return res.end();
  }
  if (req.method === "GET" && ["/recovery-panel", "/recovery-panel/public/index.html"].includes(url.pathname)) {
    let target = null;
    try { target = new URL(RECOVERY_PANEL_URL); } catch {}
    const localHttp = target && target.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
    if (!target || (target.protocol !== "https:" && !localHttp) || target.username || target.password) {
      return json(res, 503, {
        error: "The Recovery Panel is a separate application. Configure RECOVERY_PANEL_URL with its HTTPS address on the dashboard server."
      });
    }
    res.writeHead(302, {
      "Location": target.toString(),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    });
    return res.end();
  }
  if (req.method === "POST" && url.pathname === "/api/discord/webhook/test") {
    if (!DISCORD_WEBHOOK_URL) return json(res, 503, { error: "Webhook is not configured. Set DISCORD_WEBHOOK_URL in the server environment, then restart the dashboard." });
    if (!allowedRate("discord-webhook-test:" + (req.socket.remoteAddress || "unknown"))) {
      return json(res, 429, { error: "Webhook test rate limit reached. Wait one minute before trying again." });
    }
    let webhook;
    try {
      webhook = new URL(DISCORD_WEBHOOK_URL);
      if (webhook.protocol !== "https:" ||
          !["discord.com", "discordapp.com"].includes(webhook.hostname) ||
          !/^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/.test(webhook.pathname) ||
          webhook.search || webhook.hash || webhook.username || webhook.password) {
        return json(res, 503, { error: "DISCORD_WEBHOOK_URL must be a valid HTTPS Discord webhook URL." });
      }
    } catch {
      return json(res, 503, { error: "DISCORD_WEBHOOK_URL is not a valid URL." });
    }
    try {
      const delivery = await fetch(webhook, {
        method: "POST",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Discord Bot Builder connection test: webhook delivery is working.",
          allowed_mentions: { parse: [] }
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (!delivery.ok) return json(res, 502, { error: "Discord rejected the test message (HTTP " + delivery.status + "). Check that the webhook is active." });
      return json(res, 200, { delivered: true, message: "Test message delivered to the configured Discord webhook." });
    } catch {
      return json(res, 502, { error: "Could not deliver the webhook test. Check the server's outbound connection and webhook configuration." });
    }
  }
  if (req.method === "GET" && url.pathname === "/api/integrations/status") {
    return json(res, 200, {
      telegramConfigured: TELEGRAM_CONFIGURED,
      telegramBotUsername: TELEGRAM_CONFIGURED ? TELEGRAM_BOT_USERNAME : null
    });
  }
  if (req.method === "POST" && url.pathname === "/api/telegram/verify") {
    if (!TELEGRAM_CONFIGURED) return json(res, 503, { error: "Telegram login is not configured. Set TELEGRAM_BOT_USERNAME and TELEGRAM_BOT_TOKEN on the server." });
    if (!allowedRate(req.socket.remoteAddress || "unknown")) return json(res, 429, { error: "Too many Telegram verification attempts. Wait a minute and try again." });
    let input;
    try { input = await readBody(req); }
    catch { return json(res, 400, { error: "Invalid Telegram login response." }); }
    const allowed = ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"];
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !allowed.includes(key))) {
      return json(res, 400, { error: "Telegram login response contains unexpected fields." });
    }
    if (!/^\d+$/.test(String(input.id || "")) || typeof input.first_name !== "string" || typeof input.hash !== "string" || !/^[a-f0-9]{64}$/i.test(input.hash) || !/^\d+$/.test(String(input.auth_date || ""))) {
      return json(res, 400, { error: "Telegram login response is missing required signed fields." });
    }
    const authDate = Number(input.auth_date), now = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(authDate) || authDate > now + 60 || now - authDate > 86400) {
      return json(res, 401, { error: "Telegram login response has expired. Sign in again using Telegram." });
    }
    const checkString = Object.keys(input).filter(key => key !== "hash").sort().map(key => key + "=" + String(input[key])).join("\n");
    const secret = createHash("sha256").update(TELEGRAM_BOT_TOKEN).digest();
    const expected = createHmac("sha256", secret).update(checkString).digest();
    const received = Buffer.from(input.hash, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return json(res, 401, { error: "Telegram signature verification failed. Check the bot token and configured domain." });
    }
    return json(res, 200, {
      verified: true,
      user: {
        id: String(input.id),
        username: typeof input.username === "string" ? input.username.slice(0, 64) : "",
        firstName: input.first_name.slice(0, 128),
        lastName: typeof input.last_name === "string" ? input.last_name.slice(0, 128) : ""
      }
    });
  }
  if (req.method === "POST" && url.pathname === "/api/recovery-intake") {
    if (!RECOVERY_PANEL_INTAKE_URL || RECOVERY_INTAKE_TOKEN.length < 32) {
      return json(res, 503, { error: "Administrator-reviewed recovery intake is not configured on this server." });
    }
    if (!allowedRate(req.socket.remoteAddress || "unknown")) {
      return json(res, 429, { error: "Too many recovery submissions. Please wait before trying again." });
    }
    let input;
    try { input = await readBody(req); }
    catch (e) { return json(res, 400, { error: e.message === "Request too large" ? e.message : "Invalid recovery submission." }); }
    if (!input || input.consent !== true || !input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
      return json(res, 400, { error: "Review the privacy notice and confirm consent before submitting." });
    }
    const allowedRecoveryFields = new Set(["accountId","display","oldDisplay","email","oldEmail","firstName","lastName","country","incident","error","date","firstSeen","details","mfaAccess","twoStepMethods","connectedAccounts","linked","appeal","platform","platformId","caseId","noticeDate","requestedOutcome","changeRequestType","requestedEmail","requestedDisplayName"]);
    const unknownRecoveryFields = Object.keys(input.payload).filter(key => !allowedRecoveryFields.has(key));
    if (unknownRecoveryFields.length) return json(res, 400, { error: "Unsupported recovery field(s): " + unknownRecoveryFields.join(", ") });
    let endpoint;
    try {
      endpoint = new URL("/api/intake", RECOVERY_PANEL_INTAKE_URL);
      if (endpoint.protocol !== "https:" && process.env.NODE_ENV === "production") {
        return json(res, 503, { error: "The recovery panel intake endpoint must use HTTPS in production." });
      }
    } catch { return json(res, 503, { error: "The recovery panel intake URL is invalid." }); }
    let upstream;
    try {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + RECOVERY_INTAKE_TOKEN },
        body: JSON.stringify({ consent: true, payload: input.payload, website: input.website || "" }),
        signal: AbortSignal.timeout(15000)
      });
    } catch { return json(res, 502, { error: "The private recovery panel could not be reached. No request was confirmed as saved." }); }
    let result = {};
    try { result = await upstream.json(); } catch {}
    if (!upstream.ok) return json(res, upstream.status, { error: result.error || "The private recovery panel rejected the request." });
    return json(res, 201, result);
  }
  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, { provider: "DeepSeek", apiKeyConfigured: Boolean(API_KEY), accessPasswordConfigured: Boolean(CHAT_PASSWORD), configured: Boolean(API_KEY && CHAT_PASSWORD) });
  }
  if (req.method === "POST" && url.pathname === "/api/chat") {
    if (!API_KEY || !CHAT_PASSWORD) return json(res, 503, { error: "Chat is not configured. Ask the administrator to configure the server-side chat credentials." });
    if (!sameSecret(req.headers["x-chat-access"], CHAT_PASSWORD)) return json(res, 401, { error: "The app access password is incorrect." });
    const ip = req.socket.remoteAddress || "unknown";
    if (!allowedRate(ip)) return json(res, 429, { error: "Too many requests. Wait a minute and try again." });
    let input;
    try { input = await readBody(req); }
    catch (e) { return json(res, 400, { error: e.message === "Request too large" ? e.message : "Invalid JSON request." }); }
    if (!Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 20) {
      return json(res, 400, { error: "Send between 1 and 20 recent chat messages." });
    }
    const messages = [];
    for (const item of input.messages) {
      if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || !item.content.trim() || item.content.length > 6000) {
        return json(res, 400, { error: "Each message must contain a user/assistant role and 1–6000 characters." });
      }
      messages.push({ role: item.role, content: item.content });
    }
    const system = {
      role: "system",
      content: "You are Faze Jarvis, a practical coding and defensive-security assistant. Help with ordinary software engineering, debugging, secure configuration, threat modeling, and authorized defensive testing. Do not provide instructions, code, or workflows for credential theft, malware, unauthorized access, exploitation of real targets, stealth, evasion, or bypassing authentication or safety controls. Never ask users to paste API keys, passwords, tokens, cookies, recovery codes, payment secrets, or private keys. If a request is unsafe, briefly refuse and offer a safe defensive alternative. Do not claim to have executed code or changed external systems."
    };
    let upstream;
    try {
      upstream = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-flash",
          thinking: { type: "enabled" },
          safety_check: { level: "high" },
          max_tokens: 4096,
          stream: false,
          messages: [system, ...messages]
        }),
        signal: AbortSignal.timeout(45000)
      });
    } catch {
      return json(res, 502, { error: "Could not reach DeepSeek. Check the server connection and try again." });
    }
    if (!upstream.ok) {
      return json(res, 502, { error: upstream.status === 401 ? "DeepSeek rejected the server API key. Check or replace DEEPSEEK_API_KEY on the server." : upstream.status === 402 ? "DeepSeek reports insufficient balance. Check billing or available credits in your DeepSeek platform account." : upstream.status === 429 ? "DeepSeek rate limit reached. Wait briefly and try again." : upstream.status >= 500 ? "DeepSeek is temporarily unavailable. Wait briefly and try again." : "DeepSeek rejected the request (HTTP " + upstream.status + "). Check the model and API documentation." });
    }
    let result;
    try { result = await upstream.json(); }
    catch { return json(res, 502, { error: "DeepSeek returned an unreadable response." }); }
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return json(res, 502, { error: "DeepSeek returned an empty response." });
    return json(res, 200, { reply: answer, model: result.model || "deepseek-flash" });
  }
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });
  const entry = files.get(url.pathname);
  if (!entry) return json(res, 404, { error: "Not found." });
  try {
    let body = await readFile(path.join(ROOT, entry[0]));
    if (url.pathname === "/" || url.pathname === "/index.html") {
      body = Buffer.from(body.toString("utf8").replace('<main class="wrap">', '<main class="wrap"><form method="post" action="/api/auth/logout" style="display:flex;justify-content:flex-end;margin-bottom:12px"><button type="submit" class="secondary" style="background:#7f1d1d;color:#fff">Sign out</button></form>').replace("</nav>", '<a class="tab" href="/network-tools.html" style="display:inline-block;text-decoration:none;text-align:center">IP &amp; Network Tools</a><a class="tab" href="/network-lab.html" style="display:inline-block;text-decoration:none;text-align:center">DigitalOcean &amp; VPS Lab</a><a class="tab" href="/server-network-lab.html" style="display:inline-block;text-decoration:none;text-align:center">Server Setup &amp; Packages</a></nav>'));
    }
    res.writeHead(200, {
      "Content-Type": entry[1],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://telegram.org; frame-src 'self' https://oauth.telegram.org; worker-src 'self' blob: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
      "X-Frame-Options": "SAMEORIGIN"
    });
    res.end(body);
  } catch { json(res, 500, { error: "A required application asset could not be read." }); }
});
server.listen(PORT, "0.0.0.0", () => {
  console.log("Recovery Assistant web server listening on " + PORT);
  console.log("DeepSeek chat configured: " + Boolean(API_KEY && CHAT_PASSWORD));
  console.log("Telegram login configured: " + TELEGRAM_CONFIGURED);
  console.log("Dashboard sign-in enabled; first-run registration is available when no account exists.");
});
