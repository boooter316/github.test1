import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(here, "../server.mjs");
let child;
let baseUrl;

async function unusedPort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

before(async () => {
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [serverPath], {
    cwd: here,
    env: {
      ...process.env,
      PORT: String(port),
      WEB_ROOT: path.resolve(here, ".."),
      DEEPSEEK_API_KEY: "",
      CHAT_ACCESS_PASSWORD: "",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_BOT_USERNAME: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let startupError = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", chunk => { startupError += chunk; });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Web server exited during startup: ${startupError}`);
    }
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {
      // The server has not started listening yet.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill();
  throw new Error(`Timed out waiting for web server startup: ${startupError}`);
});

after(() => {
  if (child && child.exitCode === null) child.kill();
});

test("health endpoint returns a no-store success response", async () => {
  const response = await fetch(`${baseUrl}/healthz`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "ok\n");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("integration status does not expose an unconfigured Telegram bot", async () => {
  const response = await fetch(`${baseUrl}/api/integrations/status`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    telegramConfigured: false,
    telegramBotUsername: null
  });
});

test("cross-origin requests with an unrelated Origin are rejected", async () => {
  const response = await fetch(`${baseUrl}/api/integrations/status`, {
    headers: { Origin: "https://untrusted.example" }
  });
  assert.equal(response.status, 403);
});

test("chat endpoint reports missing server credentials without exposing configuration", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, { method: "POST" });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.match(body.error, /not configured/i);
  assert.equal(JSON.stringify(body).includes("DEEPSEEK_API_KEY"), false);
});

test("unknown paths return JSON 404 responses", async () => {
  const response = await fetch(`${baseUrl}/not-a-real-route`);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
});

test("main page is served with browser security headers", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(await response.text(), /Recovery Assistant/i);
});

test("DigitalOcean network lab page is served with restrictive browser security headers", async () => {
  const response = await fetch(`${baseUrl}/network-lab.html`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
  const body = await response.text();
  assert.match(body, /DigitalOcean.*Private Network Lab/i);
  assert.match(body, /WireGuard/);
  assert.match(body, /Kali Linux/);
  assert.match(body, /PuTTY/);
  assert.match(body, /does not create cloud resources/i);
});

test("main navigation links to the separate DigitalOcean VPS lab", async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();
  assert.match(body, /href="\/network-lab\.html"/);
  assert.match(body, /DigitalOcean &amp; VPS Lab/);
});
