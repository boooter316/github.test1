"use strict";

const WEBHOOK_PATH = /^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/;

function createDiscordNotifier({ url, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  return async function notify(event) {
    if (typeof url !== "string" || !url || typeof fetchImpl !== "function") return false;

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }

    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "discord.com" ||
      parsed.port ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !WEBHOOK_PATH.test(parsed.pathname)
    ) {
      return false;
    }

    const safeEvent = String(event || "panel event").replace(/[\r\n\u0000-\u001f]/g, " ").slice(0, 180);
    try {
      const response = await fetchImpl(parsed.toString(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: "Recovery Assistant panel: " + safeEvent,
          allowed_mentions: { parse: [] }
        }),
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs)
      });
      return response.ok;
    } catch {
      return false;
    }
  };
}

module.exports = { createDiscordNotifier };
