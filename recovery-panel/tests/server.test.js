"use strict";
const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdtemp, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { DatabaseSync } = require("node:sqlite");

let server, directory, dbPath, baseUrl, db;
const intakeToken = "test-intake-token-with-at-least-thirty-two-characters";
const dataKey = "a".repeat(64);

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => probe.listen(0, "127.0.0.1", resolve).once("error", reject));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}
async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(baseUrl + "/api/session");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Recovery Panel test server did not start.");
}
async function submit(payload) {
  return fetch(baseUrl + "/api/intake", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + intakeToken },
    body: JSON.stringify({ consent: true, payload })
  });
}
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "recovery-panel-test-"));
  dbPath = path.join(directory, "requests.sqlite");
  const port = await freePort();
  baseUrl = "http://127.0.0.1:" + port;
  server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env, NODE_ENV: "test", PORT: String(port),
      ADMIN_EMAIL: "admin@example.test",
      ADMIN_PASSWORD_SCRYPT: "b".repeat(32) + ":" + "c".repeat(128),
      SESSION_SECRET: "session-secret-for-tests-at-least-32-characters",
      RECOVERY_INTAKE_TOKEN: intakeToken,
      RECOVERY_DATA_KEY: dataKey,
      RECOVERY_DB_PATH: dbPath
    },
    stdio: "ignore"
  });
  await waitForServer();
  db = new DatabaseSync(dbPath);
});
after(async () => {
  if (db) db.close();
  if (server && server.exitCode === null) server.kill("SIGTERM");
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("accepts consented non-secret details and stores the payload encrypted", async () => {
  const response = await submit({
    accountId: "123456", display: "ExamplePlayer",
    twoStepMethods: ["Authenticator app", "Email"],
    connectedAccounts: [{ platform: "ExamplePlatform", username: "player-name", publicId: "public-123" }]
  });
  assert.equal(response.status, 201);
  const row = db.prepare("SELECT encrypted_payload FROM recovery_requests LIMIT 1").get();
  assert.ok(row);
  assert.equal(row.encrypted_payload.includes("ExamplePlayer"), false);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM recovery_events").get().count, 1);
});

test("rejects secret-like values inside arrays and nested connected-account fields", async () => {
  const beforeCount = db.prepare("SELECT COUNT(*) AS count FROM recovery_requests").get().count;
  const arrayResponse = await submit({ accountId: "123", twoStepMethods: ["password: hunter2"] });
  assert.equal(arrayResponse.status, 400);
  const nestedResponse = await submit({
    accountId: "123",
    connectedAccounts: [{ platform: "ExamplePlatform", username: "Bearer abcdefghijklmnopqrstuvwxyz" }]
  });
  assert.equal(nestedResponse.status, 400);
  const jwtResponse = await submit({
    accountId: "123",
    connectedAccounts: [{ platform: "ExamplePlatform", username: "eyJabcdefghijk.eyJabcdefghijk.eyJabcdefghijk" }]
  });
  assert.equal(jwtResponse.status, 400);
  const phraseResponse = await submit({ accountId: "123", details: "I can provide my password is hunter2 and backup code 123456." });
  assert.equal(phraseResponse.status, 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM recovery_requests").get().count, beforeCount);
});

test("rolls back the recovery request when its event insert fails", async () => {
  db.exec("CREATE TRIGGER fail_recovery_event BEFORE INSERT ON recovery_events BEGIN SELECT RAISE(FAIL, 'simulated event failure'); END;");
  const beforeCount = db.prepare("SELECT COUNT(*) AS count FROM recovery_requests").get().count;
  const response = await submit({ accountId: "rollback-test", display: "RollbackPlayer" });
  assert.equal(response.status, 500);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM recovery_requests").get().count, beforeCount);
  db.exec("DROP TRIGGER fail_recovery_event");
});
