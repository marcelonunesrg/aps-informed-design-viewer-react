const test = require("node:test");
const assert = require("node:assert/strict");

const { createConfirmationStore } = require("../utils/confirmationStore");
const { createTerminalExecutor } = require("./executor");

function createExecutorForTests(overrides = {}) {
  const confirmationStore = createConfirmationStore(60_000);

  const dependencies = {
    listReleasesByProduct: async () => [
      { id: "r1", name: "Release 1", releaseNumber: "1", state: "ACTIVE" },
    ],
    normalizeReleaseListItem: (item) => item,
    resolveCurrentProductId: async () => "p1",
    fetchReleaseById: async ({ releaseId }) => ({
      id: releaseId,
      productId: "p1",
      accessType: "ACC",
      accessId: "a1",
    }),
    updateReleaseState: async ({ targetState }) => ({ state: targetState }),
    setProductDefaultRelease: async ({ productId, releaseId }) => ({ productId, releaseId }),
    buildHelpPayload: () => ({ lines: ["- help"] }),
    ...overrides,
  };

  return {
    confirmationStore,
    executor: createTerminalExecutor(confirmationStore, dependencies),
  };
}

test("executor returns help payload", async () => {
  const { executor } = createExecutorForTests();
  const result = await executor.executeParsedCommand({
    parsed: { kind: "help" },
    context: null,
    accessToken: "token",
  });

  assert.equal(result.status, "ok");
  assert.deepEqual(result.data, { lines: ["- help"] });
});

test("executor returns release list data", async () => {
  const { executor } = createExecutorForTests();
  const result = await executor.executeParsedCommand({
    parsed: { kind: "release_list" },
    context: { accessType: "ACC", accessId: "a1", currentReleaseId: "r1" },
    accessToken: "token",
  });

  assert.equal(result.status, "ok");
  assert.equal(result.data.productId, "p1");
  assert.equal(result.data.releases.length, 1);
});

test("executor confirms release tag command", async () => {
  const { executor } = createExecutorForTests();
  const context = { accessType: "ACC", accessId: "a1", currentReleaseId: "r1" };

  const pending = await executor.executeParsedCommand({
    parsed: { kind: "release_tag", targetState: "ACTIVE" },
    context,
    accessToken: "token",
  });

  assert.equal(pending.status, "confirmation_required");
  assert.ok(pending.confirmationToken);

  const confirmed = await executor.executeParsedCommand({
    parsed: { kind: "confirm" },
    context,
    accessToken: "token",
    confirmationToken: pending.confirmationToken,
  });

  assert.equal(confirmed.status, "ok");
  assert.match(confirmed.output, /tagged as ACTIVE/i);
});

test("executor cancels pending command", async () => {
  const { executor } = createExecutorForTests();
  const context = { accessType: "ACC", accessId: "a1", currentReleaseId: "r1" };

  const pending = await executor.executeParsedCommand({
    parsed: { kind: "release_set_default" },
    context,
    accessToken: "token",
  });

  const canceled = await executor.executeParsedCommand({
    parsed: { kind: "cancel" },
    context,
    accessToken: "token",
    confirmationToken: pending.confirmationToken,
  });

  assert.equal(canceled.status, "ok");
  assert.match(canceled.output, /canceled/i);
});
