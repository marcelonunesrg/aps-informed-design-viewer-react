const test = require("node:test");
const assert = require("node:assert/strict");

const { buildHelpPayload } = require("./help");

test("help payload contains core terminal commands", () => {
  const payload = buildHelpPayload();

  assert.ok(Array.isArray(payload.lines));
  assert.ok(payload.lines.includes("- release list"));
  assert.ok(payload.lines.includes("- release use <releaseId>"));
  assert.ok(payload.lines.includes("- release tag active"));
  assert.ok(payload.lines.includes("- release set-default"));
});
