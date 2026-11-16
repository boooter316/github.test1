"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { identifierCounts, countLines } = require("../public/identifier-scanner.js");

test("counts email patterns without returning matched addresses", () => {
  const result = identifierCounts("Contact owner@example.com or backup+test@example.org");
  assert.deepEqual(result, { email: 2, fortnite: 0, epic: 0 });
  assert.deepEqual(Object.keys(result).sort(), ["email", "epic", "fortnite"]);
  assert.equal(JSON.stringify(result).includes("owner@example.com"), false);
});

test("counts labelled Fortnite display-name and username fields", () => {
  const result = identifierCounts("Fortnite display name: PlayerOne; username=PlayerTwo");
  assert.equal(result.fortnite, 2);
});

test("counts labelled Epic account IDs and UUID-shaped IDs", () => {
  const labelled = identifierCounts("Epic Account ID: 12345678-1234-4234-8234-123456789abc");
  assert.equal(labelled.epic, 1);
  const bare = identifierCounts("Reference: 12345678-1234-4234-8234-123456789abc");
  assert.equal(bare.epic, 0, "unlabelled UUIDs are not assumed to be Epic account IDs");
});

test("returns only line numbers and category counts", () => {
  const result = countLines([
    "Contact owner@example.com",
    "Fortnite username: PlayerOne",
    "Epic Account ID: 12345678-1234-4234-8234-123456789abc"
  ].join("\n"));
  assert.deepEqual(result.summary, { email: 1, fortnite: 1, epic: 1 });
  assert.deepEqual(result.locations.map(x => x.line), [1, 2, 3]);
  assert.equal(JSON.stringify(result).includes("PlayerOne"), false);
  assert.equal(JSON.stringify(result).includes("owner@example.com"), false);
});
