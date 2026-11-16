"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

class Element {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.disabled = false;
    this.files = [];
    this.children = [];
    this.listeners = {};
    this.classList = {
      add() {},
      remove() {},
      toggle() {}
    };
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren() { this.children = []; }
  click() { return this.listeners.click?.(); }
}

function bootDashboard() {
  const elements = new Map();
  const getElementById = (id) => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };
  const document = {
    getElementById,
    querySelectorAll: () => [],
    createElement: (tag) => new Element(tag),
    body: new Element("body")
  };
  const window = { scrollTo() {} };
  const source = fs.readFileSync(path.join(__dirname, "..", "dashboard.js"), "utf8");
  vm.runInNewContext(source, { document, window, console });
  return { elements, getElementById };
}

test("selecting a binary or oversized file clears and disables the previous editor content", async () => {
  const { getElementById } = bootDashboard();
  const textFile = {
    name: "a-notes.txt", size: 12,
    async text() { return "safe editable text"; }
  };
  const binaryFile = {
    name: "b-image.png", size: 128,
    async text() { throw new Error("binary file should not be read"); }
  };
  const largeFile = {
    name: "c-large.txt", size: 2 * 1024 * 1024 + 1,
    async text() { throw new Error("oversized file should not be read"); }
  };

  await getElementById("folderFallback").listeners.change({ target: { files: [textFile, binaryFile, largeFile] } });
  const fileButtons = getElementById("fileList").children;
  assert.equal(fileButtons.length, 3);

  await fileButtons[0].click();
  assert.equal(getElementById("sourceEditor").value, "safe editable text");
  assert.equal(getElementById("sourceEditor").disabled, false);
  assert.equal(getElementById("saveSource").disabled, false);

  await fileButtons[1].click();
  assert.equal(getElementById("sourceEditor").value, "");
  assert.equal(getElementById("sourceEditor").disabled, true);
  assert.equal(getElementById("saveSource").disabled, true);
  assert.equal(getElementById("discardEdit").disabled, true);

  await fileButtons[2].click();
  assert.equal(getElementById("sourceEditor").value, "");
  assert.equal(getElementById("sourceEditor").disabled, true);
  assert.equal(getElementById("saveSource").disabled, true);
});
