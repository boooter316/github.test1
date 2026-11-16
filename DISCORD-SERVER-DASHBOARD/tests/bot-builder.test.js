"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "bot-builder.html"), "utf8");
const inline = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!inline) throw new Error("Bot Builder inline script was not found.");

class Element {
  constructor(id = "", dataset = {}) {
    this.id = id;
    this.dataset = dataset;
    this.value = "";
    this.textContent = "";
    this.disabled = false;
    this.hidden = false;
    this.attributes = {};
    this.listeners = {};
    this.children = [];
    this.download = "";
    this.href = "";
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  appendChild(child) { this.children.push(child); return child; }
  remove() {}
  click() { this.clicked = (this.clicked || 0) + 1; return this.listeners.click?.(); }
}

function boot(fetchImpl = async () => ({ ok: true, async json() { return { message: "Webhook test delivered." }; } })) {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };
  const tabNames = ["server", "bot", "tickets", "cpp"];
  const tabs = tabNames.map(name => new Element("tab-" + name, { tab: name }));
  const panels = tabNames.map(name => {
    const panel = new Element(name);
    panel.hidden = name !== "server";
    return panel;
  });
  const document = {
    querySelectorAll(selector) {
      if (selector === "[data-tab]") return tabs;
      if (selector === "main>section.panel") return panels;
      return [];
    },
    getElementById,
    createElement: tag => new Element(tag),
    body: new Element("body")
  };
  getElementById("serverName").value = "My Community Server";
  getElementById("botName").value = "Helper Bot";
  getElementById("roles").value = "Owner, Admin, Moderator, Support, Member";
  getElementById("channels").value = "welcome, announcements, general, support, ticket-log";
  getElementById("ticketCategory").value = "Support Tickets";
  class FakeBlob {
    constructor(parts, options = {}) { this.parts = parts; this.type = options.type || ""; }
  }
  const context = {
    document,
    window: {},
    fetch: fetchImpl,
    Blob: FakeBlob,
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
    console
  };
  vm.runInNewContext(inline[1], context, { filename: "bot-builder.inline.js" });
  return { elements, tabs, panels, getElementById };
}

test("server blueprint normalizes channels and removes duplicates", () => {
  const { getElementById } = boot();
  getElementById("serverName").value = "  Test Server  ";
  getElementById("botName").value = "  Helper  ";
  getElementById("roles").value = "Admin, Support, Admin";
  getElementById("channels").value = "General, ticket logs, General!!";
  getElementById("ticketCategory").value = "Help Desk";

  getElementById("buildBlueprint").click();
  const blueprint = JSON.parse(getElementById("blueprintPreview").textContent);
  assert.equal(blueprint.server.name, "Test Server");
  assert.equal(blueprint.bot.name, "Helper");
  assert.deepEqual(Array.from(blueprint.server.roles), ["Admin", "Support"]);
  assert.deepEqual(
    Array.from(blueprint.server.channels, channel => ({ name: channel.name, type: channel.type })),
    [{ name: "general", type: "text" }, { name: "ticket-logs", type: "text" }]
  );
  assert.equal(blueprint.server.ticketCategory, "Help Desk");
  assert.equal(blueprint.safety.secrets, "Never include bot tokens or webhook URLs in this file");
});

test("builder tabs switch the selected panel accessibly", () => {
  const { tabs, panels } = boot();
  tabs[1].click();
  assert.equal(tabs[1].attributes["aria-selected"], "true");
  assert.equal(panels.find(panel => panel.id === "bot").hidden, false);
  assert.equal(panels.find(panel => panel.id === "server").hidden, true);

  tabs[3].click();
  assert.equal(tabs[3].attributes["aria-selected"], "true");
  assert.equal(panels.find(panel => panel.id === "cpp").hidden, false);
  assert.equal(panels.find(panel => panel.id === "bot").hidden, true);
});

test("webhook test sends one request and restores the button after delivery", async () => {
  let resolveFetch;
  let calls = 0;
  const { getElementById } = boot(() => {
    calls += 1;
    return new Promise(resolve => { resolveFetch = resolve; });
  });
  const button = getElementById("testWebhook");
  const status = getElementById("webhookResult");
  const pending = button.click();

  assert.equal(button.disabled, true);
  assert.equal(status.textContent, "Sending one test message…");
  assert.equal(calls, 1);
  resolveFetch({ ok: true, async json() { return { message: "Webhook test delivered." }; } });
  await pending;

  assert.equal(status.textContent, "Webhook test delivered.");
  assert.equal(button.disabled, false);
});

test("webhook errors are shown without leaving the button disabled", async () => {
  const { getElementById } = boot(async () => ({
    ok: false,
    async json() { return { error: "Webhook is not configured." }; }
  }));
  const button = getElementById("testWebhook");
  const status = getElementById("webhookResult");

  await button.click();
  assert.equal(status.textContent, "Webhook is not configured.");
  assert.equal(button.disabled, false);
});
