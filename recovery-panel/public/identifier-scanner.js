"use strict";

(function attachIdentifierScanner(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RecoveryIdentifierScanner = api;
})(typeof globalThis === "object" ? globalThis : this, function createIdentifierScanner() {
  const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const FORTNITE_LABEL = /(?:fortnite\s+(?:display\s*name|username)|display\s*name|username)\s*[:=|—-]\s*[^\r\n,;]{2,40}/gi;
  const EPIC_LABEL = /(?:epic\s*(?:games\s*)?(?:account\s*)?(?:id|identifier)|account\s*id)\s*[:=#|—-]\s*[A-Z0-9-]{8,40}/gi;
  const EPIC_UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

  function countMatches(text, pattern) {
    pattern.lastIndex = 0;
    let count = 0;
    while (pattern.exec(text)) count++;
    pattern.lastIndex = 0;
    return count;
  }

  function identifierCounts(value) {
    const text = String(value || "");
    const email = countMatches(text, EMAIL);
    const fortnite = countMatches(text, FORTNITE_LABEL);
    const epicLabel = countMatches(text, EPIC_LABEL);
    const epicUuid = countMatches(text, EPIC_UUID);
    return { email, fortnite, epic: Math.max(epicLabel, epicUuid) };
  }

  function countLines(value) {
    const lines = String(value || "").split(/\r?\n/);
    const summary = { email: 0, fortnite: 0, epic: 0 };
    const locations = [];
    lines.forEach((line, index) => {
      const counts = identifierCounts(line);
      if (counts.email || counts.fortnite || counts.epic) {
        summary.email += counts.email;
        summary.fortnite += counts.fortnite;
        summary.epic += counts.epic;
        locations.push({ line: index + 1, counts });
      }
    });
    return { summary, locations };
  }

  return Object.freeze({ identifierCounts, countLines });
});
