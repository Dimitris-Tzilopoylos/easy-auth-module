const { v4 } = require("uuid");

class MemoryStorage {
  static storage = new Map();
  static timeouts = {};

  static async set(key, value, ttl) {
    if (MemoryStorage.validateTTL(ttl)) {
      return await MemoryStorage.setWithTTL(key, value, ttl);
    }

    MemoryStorage.storage.set(key, value);
    return Promise.resolve(value);
  }

  static async setWithTTL(key, value, ttl) {
    MemoryStorage.storage.set(key, value);

    const id = v4();
    MemoryStorage.timeouts[id] = { id, ttl, key };
    const timeout = setTimeout(async () => {
      await MemoryStorage.delete(key);
    }, ttl * 1000);
    MemoryStorage.timeouts[id].timeout = timeout;
    timeout.unref();

    return Promise.resolve(value);
  }

  static async get(key) {
    return Promise.resolve(MemoryStorage.storage.get(key));
  }

  static delete(key) {
    const value = MemoryStorage.storage.get(key);
    const timer = Object.values(MemoryStorage.timeouts).find((x) => x === key);
    if (timer) {
      clearTimeout(timer);
      delete MemoryStorage.timeouts[timer.id];
    }

    MemoryStorage.storage.delete(key);
    return Promise.resolve(value);
  }

  static validateTTL(ttl) {
    return isNaN(ttl) || parseInt(ttl) <= 0;
  }

  static async flushAll() {
    Object.values(MemoryStorage.timeouts).every(({ timeout }) =>
      clearTimeout(timeout)
    );
    MemoryStorage.timeouts = {};
    MemoryStorage.storage = new Map();
  }
}

module.exports = MemoryStorage;
