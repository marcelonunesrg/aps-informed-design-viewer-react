const test = require("node:test");
const assert = require("node:assert/strict");

const { createConfirmationStore } = require("./confirmationStore");

test("confirmation store saves and reads entries", () => {
  const store = createConfirmationStore(1000);
  const token = store.save({ type: "release_tag", targetState: "ACTIVE" });

  assert.ok(token);
  const entry = store.get(token);
  assert.equal(entry.type, "release_tag");
  assert.equal(entry.targetState, "ACTIVE");
});

test("confirmation store deletes entries", () => {
  const store = createConfirmationStore(1000);
  const token = store.save({ type: "release_set_default" });

  assert.ok(store.get(token));
  store.deleteToken(token);
  assert.equal(store.get(token), null);
});

test("confirmation store expires entries", async () => {
  const store = createConfirmationStore(10);
  const token = store.save({ type: "release_tag" });

  await new Promise((resolve) => {
    setTimeout(resolve, 25);
  });

  assert.equal(store.get(token), null);
});
