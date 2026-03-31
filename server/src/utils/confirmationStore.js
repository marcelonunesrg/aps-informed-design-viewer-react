function createConfirmationStore(ttlMs) {
  const queue = new Map();

  function createToken() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function save(entry) {
    const token = createToken();
    queue.set(token, {
      ...entry,
      createdAt: Date.now(),
    });
    return token;
  }

  function cleanupExpired() {
    const now = Date.now();
    for (const [token, entry] of queue.entries()) {
      if (now - entry.createdAt > ttlMs) {
        queue.delete(token);
      }
    }
  }

  function get(token) {
    if (!token) {
      return null;
    }

    cleanupExpired();
    return queue.get(token) || null;
  }

  function deleteToken(token) {
    if (!token) {
      return;
    }

    queue.delete(token);
  }

  function isExpired(entry) {
    return Date.now() - entry.createdAt > ttlMs;
  }

  return {
    save,
    get,
    deleteToken,
    cleanupExpired,
    isExpired,
  };
}

module.exports = {
  createConfirmationStore,
};
