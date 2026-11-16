"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDiscordNotifier } = require("../discord-webhook");

test("does not send to non-Discord, malformed, or decorated webhook URLs", async () => {
  let calls = 0;
  const notify = createDiscordNotifier({
    url: "https://example.com/api/webhooks/123456789012345678/token",
    fetchImpl: async () => { calls += 1; return new Response(null, { status: 204 }); }
  });
  assert.equal(await notify("sign-in successful"), false);
  assert.equal(calls, 0);

  for (const url of [
    "http://discord.com/api/webhooks/123456789012345678/token",
    "https://discord.com.evil.example/api/webhooks/123456789012345678/token",
    "https://user:pass@discord.com/api/webhooks/123456789012345678/token",
    "https://discord.com/api/webhooks/not-an-id/token",
    "https://discord.com/api/webhooks/123456789012345678/token?redirect=https://evil.example"
  ]) {
    const guarded = createDiscordNotifier({ url, fetchImpl: async () => { calls += 1; } });
    assert.equal(await guarded("test"), false, url);
  }
  assert.equal(calls, 0);
});

test("sends a single bounded notification with mentions disabled and redirects rejected", async () => {
  let captured;
  const notify = createDiscordNotifier({
    url: "https://discord.com/api/webhooks/123456789012345678/AbCdEf_123",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(null, { status: 204 });
    }
  });

  assert.equal(await notify("sign-in\nattempt @everyone"), true);
  assert.equal(captured.url, "https://discord.com/api/webhooks/123456789012345678/AbCdEf_123");
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.redirect, "error");
  assert.deepEqual(JSON.parse(captured.options.body).allowed_mentions, { parse: [] });
  assert.equal(JSON.parse(captured.options.body).content.includes("\n"), false);
  assert.ok(captured.options.signal instanceof AbortSignal);
});

test("reports unsuccessful delivery without throwing", async () => {
  const rejected = createDiscordNotifier({
    url: "https://discord.com/api/webhooks/123456789012345678/token",
    fetchImpl: async () => new Response(null, { status: 503 })
  });
  const networkError = createDiscordNotifier({
    url: "https://discord.com/api/webhooks/123456789012345678/token",
    fetchImpl: async () => { throw new Error("network unavailable"); }
  });
  assert.equal(await rejected("test"), false);
  assert.equal(await networkError("test"), false);
});
