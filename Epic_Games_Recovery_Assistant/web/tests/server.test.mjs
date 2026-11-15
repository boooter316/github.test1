import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
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

test("each browser workspace receives scoped stop, upgrade, build, and download controls", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  const body = await response.text();
  for (const label of ["Stop", "Upgrade", "Build / Self-test", "Download report"]) {
    assert.ok(body.includes(label), "Missing workspace action: " + label);
  }
  assert.match(body, /document\.querySelectorAll\("section\[id\]"\)\.forEach\(addToolbar\)/);
  assert.match(body, /const currentRoot=activeRoot\(\)/);
  assert.match(body, /Form field values, passwords, tokens, cookies, and file contents are not included/);
  assert.match(body, /window\.__pdfEvidenceCancelRequested=true/);
  assert.match(body, /Stopped by user after page/);
});

test("Recovery Panel records and PDF tabs include independent workspace actions", async () => {
  const panelPath = path.resolve(here, "../../../recovery-panel/public/index.html");
  const body = await readFile(panelPath, "utf8");
  assert.match(body, /recordsTabPanel/);
  assert.match(body, /pdfScannerTabPanel/);
  assert.match(body, /Workspace actions — /);
  for (const label of ["Stop", "Upgrade", "Build / Self-test", "Download report"]) {
    assert.ok(body.includes(label), "Missing Recovery Panel action: " + label);
  assert.match(body, /window\.__panelPdfCancelRequested=true/);
  assert.match(body, /Stopped by user after page/);
  }
});
