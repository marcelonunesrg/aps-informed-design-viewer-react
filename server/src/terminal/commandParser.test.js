const test = require("node:test");
const assert = require("node:assert/strict");

const { parseTerminalCommand, validateCommandContext } = require("./commandParser");

test("parseTerminalCommand parses valid commands", () => {
  assert.deepEqual(parseTerminalCommand("help"), { kind: "help" });
  assert.deepEqual(parseTerminalCommand("clear"), { kind: "clear" });
  assert.deepEqual(parseTerminalCommand("release list"), { kind: "release_list" });
  assert.deepEqual(parseTerminalCommand("release use rel-123"), {
    kind: "release_use",
    releaseId: "rel-123",
  });
  assert.deepEqual(parseTerminalCommand("release tag active"), {
    kind: "release_tag",
    targetState: "ACTIVE",
  });
  assert.deepEqual(parseTerminalCommand("release set-default"), {
    kind: "release_set_default",
  });
});

test("parseTerminalCommand rejects invalid command", () => {
  const result = parseTerminalCommand("unknown command");
  assert.equal(result.kind, "invalid");
  assert.match(result.error, /Unsupported command/i);
});

test("validateCommandContext enforces required fields", () => {
  assert.equal(
    validateCommandContext({ accessType: "ACC", accessId: "acc-1", currentReleaseId: "rel-1" }),
    null,
  );

  assert.match(validateCommandContext(null), /required/i);
  assert.match(validateCommandContext({ accessType: "ACC", accessId: "acc-1" }), /requires/i);
});
