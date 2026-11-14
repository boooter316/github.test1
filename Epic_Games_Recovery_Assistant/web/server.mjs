import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { timingSafeEqual, createHash, createHmac } from "node:crypto";

const ROOT = process.env.WEB_ROOT || process.cwd();
const PORT = Number(process.env.PORT || 8080);
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const CHAT_PASSWORD = process.env.CHAT_ACCESS_PASSWORD || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
const TELEGRAM_CONFIGURED = Boolean(TELEGRAM_BOT_TOKEN && /^[A-Za-z0-9_]{5,32}$/.test(TELEGRAM_BOT_USERNAME));
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/network_security.js", ["network_security.js", "text/javascript; charset=utf-8"]],
  ["/network-tools.html", ["network-tools.html", "text/html; charset=utf-8"]],
  ["/network_tools.ps1", ["network_tools.ps1", "text/plain; charset=utf-8"]],
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
  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, { provider: "DeepSeek", apiKeyConfigured: Boolean(API_KEY), accessPasswordConfigured: Boolean(CHAT_PASSWORD), configured: Boolean(API_KEY && CHAT_PASSWORD) });
  }
  if (req.method === "POST" && url.pathname === "/api/chat") {
    if (!API_KEY || !CHAT_PASSWORD) return json(res, 503, { error: "Chat is not configured. Set DEEPSEEK_API_KEY and CHAT_ACCESS_PASSWORD on the server." });
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
      body = Buffer.from(body.toString("utf8").replace("</nav>", '<a class="tab" href="/network-tools.html" style="display:inline-block;text-decoration:none;text-align:center">IP &amp; Network Tools</a></nav>'));
    }
    res.writeHead(200, {
      "Content-Type": entry[1],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://telegram.org; frame-src https://oauth.telegram.org; worker-src 'self' blob: https://cdnjs.cloudflare.com; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      "X-Frame-Options": "DENY"
    });
    res.end(body);
  } catch { json(res, 500, { error: "A required application asset could not be read." }); }
});
server.listen(PORT, "0.0.0.0", () => {
  console.log("Recovery Assistant web server listening on " + PORT);
  console.log("DeepSeek chat configured: " + Boolean(API_KEY && CHAT_PASSWORD));
  console.log("Telegram login configured: " + TELEGRAM_CONFIGURED);
});
