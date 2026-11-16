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
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.ok((response.headers.get("content-security-policy") || "").includes("frame-ancestors 'self'"));
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(await response.text(), /Recovery Assistant/i);
});

test("main dashboard opens the companion dashboard through same-origin static routes", async () => {
  const main = await fetch(baseUrl);
  const mainHtml = await main.text();
  assert.match(mainHtml, /discordDashboardTabButton/);
  assert.match(mainHtml, /discordDashboardTab/);
  const page = await fetch(baseUrl + "/discord-server-dashboard/index.html");
  assert.equal(page.status, 200);
  assert.ok((page.headers.get("content-type") || "").includes("text/html"));
  assert.match(await page.text(), /DISCORD SERVER DASHBOARD/);
  const css = await fetch(baseUrl + "/discord-server-dashboard/dashboard.css");
  assert.equal(css.status, 200);
  assert.ok((css.headers.get("content-type") || "").includes("text/css"));
  const js = await fetch(baseUrl + "/discord-server-dashboard/dashboard.js");
  assert.equal(js.status, 200);
  assert.ok((js.headers.get("content-type") || "").includes("javascript"));
});
test("recovery form exposes structured non-secret customer and linked-platform fields", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  const body = await response.text();
  for (const field of ["firstName", "lastName", "connectedAccounts", "changeRequestType", "submitForAdminReview"]) {
    assert.ok(body.includes('id="' + field + '"'), "Missing recovery field: " + field);
  }
  assert.match(body, /public platform names, usernames, and profile IDs/i);
  assert.match(body, /Never paste passwords, cookies, tokens, or recovery codes/i);
  assert.match(body, /administrator review/i);
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

test("server package setup guide is routed and exposes machine-specific instructions", async () => {
  const response = await fetch(`${baseUrl}/server-network-lab.html`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
  const body = await response.text();
  assert.match(body, /Server &amp; Networking Lab/);
  assert.match(body, /Install Packages/);
  assert.match(body, /Windows 11 host/);
  assert.match(body, /Ubuntu LTS VPS/);
  assert.match(body, /Kali Linux VM/);
});

test("main navigation exposes both network lab workspaces", async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();
  assert.match(body, /href="\/network-lab\.html"/);
  assert.match(body, /href="\/server-network-lab\.html"/);
  assert.match(body, /Server Setup &amp; Packages/);
});

test("central dashboard lists every independently selectable browser tool", async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();
  for (const [page, label] of [
    ["recovery", "Recovery Assistant"],
    ["fazeJarvis", "Faze Jarvis AI"],
    ["security", "Discord Security Scanner"],
    ["fortnite", "Pro Multi-Tool"],
    ["pdfEvidence", "PDF Evidence Scanner"],
    ["accountLinks", "Account Links"],
    ["accountConnections", "Account Connections"],
    ["packetDiagnostics", "Wireshark &amp; Ports"],
    ["accountStatus", "Account Status &amp; Details"],
    ["telegramConnect", "Telegram Connect"],
    ["fortniteSkinCheck", "Fortnite Skin Check"],
    ["scriptBuilder", "Script Builder"],
    ["serverNetworkLab", "Server &amp; Networking Lab"],
    ["setupInstall", "Setup &amp; Install"]
  ]) {
    assert.ok(body.includes('data-open-page="' + page + '"'), "Missing launcher target: " + page);
    assert.ok(body.includes(label), "Missing visible launcher label: " + label);
  }
});

test("browser PDF evidence scanner enforces bounded local-only scan limits", async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();
  assert.match(body, /10 files per batch, 20 MB each, and 500 pages per file/);
  assert.match(body, /Select no more than 10 PDFs per scan batch/);
  assert.match(body, /Scans run manually when you press the button/);
  assert.match(body, /No document text or matched secret values are included/);
});


test("PDF and account status center exposes local-only PDF, account, and recovery trackers", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  const body = await response.text();
  for (const id of [
    "statusCenterTabButton", "statusCenterTab", "pdfTrackerList",
    "trackerAccount", "trackerAccountStatus", "saveAccountUpdate",
    "accountUpdateList", "recoveryLabel", "recoveryStage",
    "saveRecoveryProgress", "recoveryTrackerList", "clearPdfTracker"
  ]) {
    assert.ok(body.includes('id="' + id + '"'), "Missing status center control: " + id);
  }
  assert.match(body, /recoveryAssistantStatusCenterV1/);
  assert.match(body, /trackPdfScan\(file,/);
  assert.match(body, /do not sync between devices or verify account status/i);
  assert.match(body, /Never enter passwords, session cookies, access tokens, one-time codes, recovery codes/i);
});
