const CACHE_TTL_MS = 300 * 1000;
const cache = new Map();

function get(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function set(key, value) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function remove(key) {
  cache.delete(key);
}

module.exports = {
  get,
  set,
  remove,
};
