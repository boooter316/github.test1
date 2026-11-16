"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");

const root = path.resolve(__dirname, "..");
const tempRootPromise = fs.mkdtemp(path.join(os.tmpdir(), "recovery-panel-test-"));
let child;
let tempRoot;

async function unusedPort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function stopServer() {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    child.once("exit", resolve);
    child.kill();
  });
}

async function startServer(port, env) {
  child = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root, env: { ...process.env, ...env, PORT: String(port), NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { logs += chunk; });
  child.stderr.on("data", chunk => { logs += chunk; });
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Panel exited during startup: " + logs);
    try {
      const response = await fetch(base + "/api/session");
      if (response.ok) return base;
    } catch { /* Wait for the listener. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await stopServer();
  throw new Error("Panel startup timed out: " + logs);
}

async function jsonRequest(base, route, options = {}) {
  const response = await fetch(base + route, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

after(async () => {
  await stopServer();
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true });
});

test("intake, administrator review, approved export, and persistent sessions work end-to-end", async () => {
  tempRoot = await tempRootPromise;
  const port = await unusedPort();
  const salt = crypto.randomBytes(16).toString("hex");
  const adminPassword = "synthetic-test-password-only";
  const passwordHash = crypto.scryptSync(adminPassword, salt, 64).toString("hex");
  const env = {
    ADMIN_EMAIL: "admin@example.test",
    ADMIN_PASSWORD_SCRYPT: salt + ":" + passwordHash,
    SESSION_SECRET: crypto.randomBytes(48).toString("hex"),
    RECOVERY_INTAKE_TOKEN: crypto.randomBytes(48).toString("hex"),
    RECOVERY_DATA_KEY: crypto.randomBytes(32).toString("hex"),
    RECOVERY_DB_PATH: path.join(tempRoot, "requests.sqlite"),
    RECOVERY_SESSION_DB_PATH: path.join(tempRoot, "sessions.sqlite"),
    DISCORD_WEBHOOK_URL: ""
  };
  let base = await startServer(port, env);

  const panelPage = await fetch(base + "/");
  assert.equal(panelPage.status, 200);
  const panelCsp = panelPage.headers.get("content-security-policy") || "";
  assert.match(panelCsp, /script-src[^;]*cdn\\.jsdelivr\\.net/, "Recovery Panel must allow its PDF.js module CDN");
  assert.match(panelCsp, /worker-src[^;]*cdn\\.jsdelivr\\.net/, "Recovery Panel must allow its PDF.js worker CDN");

  let result = await jsonRequest(base, "/api/recovery-requests");
  assert.equal(result.response.status, 401, "request queue must require administrator authentication");
  assert.equal(result.response.headers.get("cache-control"), "no-store");

  result = await jsonRequest(base, "/api/intake", {
    method: "POST",
    body: JSON.stringify({ consent: true, payload: { accountId: "synthetic-001" } })
  });
  assert.equal(result.response.status, 401, "intake must require the server-to-server bearer token");

  result = await jsonRequest(base, "/api/intake", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RECOVERY_INTAKE_TOKEN },
    body: JSON.stringify({ consent: true, payload: { accountId: "synthetic-001", password: "must-never-be-accepted" } })
  });
  assert.equal(result.response.status, 400, "unknown and secret-like fields must be rejected");

  result = await jsonRequest(base, "/api/intake", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RECOVERY_INTAKE_TOKEN },
    body: JSON.stringify({ consent: true, payload: { accountId: "synthetic-002", details: "password: test-only-value" } })
  });
  assert.equal(result.response.status, 400, "labelled login secrets inside free-text fields must be rejected");

  result = await jsonRequest(base, "/api/intake", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RECOVERY_INTAKE_TOKEN },
    body: JSON.stringify({
      consent: true,
      payload: {
        accountId: "synthetic-001",
        firstName: "Test",
        lastName: "Customer",
        email: "customer@example.test",
        connectedAccounts: [{ platform: "Example Platform", username: "test-user", publicId: "public-123" }],
        changeRequestType: "email-change"
      }
    })
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.status, "pending-review");
  const requestId = result.body.reference;
  assert.match(requestId, /^RR-/);

  result = await jsonRequest(base, "/api/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.test", password: adminPassword })
  });
  assert.equal(result.response.status, 200);
  const setCookie = result.response.headers.get("set-cookie");
  assert.ok(setCookie, "successful login must set a session cookie");
  const cookie = setCookie.split(";")[0];

  result = await jsonRequest(base, "/api/recovery-requests", { headers: { cookie } });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.requests.length, 1);
  const id = result.body.requests[0].id;

  result = await jsonRequest(base, "/api/recovery-requests/" + encodeURIComponent(id), { headers: { cookie } });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.request.payload.accountId, "synthetic-001");
  assert.equal(result.body.request.payload.connectedAccounts[0].username, "test-user");

  result = await jsonRequest(base, "/api/recovery-requests/" + encodeURIComponent(id), {
    method: "PATCH", headers: { cookie }, body: JSON.stringify({ status: "approved", unexpected: true })
  });
  assert.equal(result.response.status, 400, "review endpoint must reject unexpected fields");

  result = await jsonRequest(base, "/api/recovery-requests/" + encodeURIComponent(id), {
    method: "PATCH", headers: { cookie }, body: JSON.stringify({ status: "approved", admin_note: "Synthetic test approved." })
  });
  assert.equal(result.response.status, 200);

  result = await jsonRequest(base, "/api/recovery-requests/" + encodeURIComponent(id), {
    method: "PATCH", headers: { cookie }, body: JSON.stringify({ status: "submitted-to-epic" })
  });
  assert.equal(result.response.status, 400, "official support reference is required before recording submission");

  result = await jsonRequest(base, "/api/recovery-requests/" + encodeURIComponent(id), {
    method: "PATCH", headers: { cookie },
    body: JSON.stringify({ status: "submitted-to-epic", epic_reference: "SYNTHETIC-CASE-001" })
  });
  assert.equal(result.response.status, 200);

  const exported = await fetch(base + "/api/recovery-requests/" + encodeURIComponent(id) + "/export", { headers: { cookie } });
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get("cache-control"), "no-store");
  const exportBody = await exported.json();
  assert.equal(exportBody.payload.accountId, "synthetic-001");
  assert.ok(exportBody.events.some(event => event.event_type === "approved-record-exported"));

  await stopServer();
  base = await startServer(port, env);
  result = await jsonRequest(base, "/api/session", { headers: { cookie } });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.authenticated, true, "administrator session must survive a process restart");

  result = await jsonRequest(base, "/api/logout", { method: "POST", headers: { cookie }, body: "{}" });
  assert.equal(result.response.status, 200);
  result = await jsonRequest(base, "/api/session", { headers: { cookie } });
  assert.equal(result.body.authenticated, false, "logout must destroy the persisted session");
});
