const cacheService = require("./cache.service");
const metricsService = require("./metrics.service");
const storageService = require("./storage.service");
const codeforcesAdapter = require("../adapters/codeforces.adapter");
const leetcodeMockAdapter = require("../adapters/leetcode.mock.adapter");
const codechefMockAdapter = require("../adapters/codechef.mock.adapter");
const { buildProfileSummary, normalizeHandle } = require("../utils/normalize");

async function getProfile(handle) {
  const key = normalizeHandle(handle);
  const cachedProfile = cacheService.get(key);

  if (cachedProfile) {
    metricsService.increment("cacheHits");

    return {
      source: "cache_hit",
      data: cachedProfile,
    };
  }

  metricsService.increment("cacheMisses");
  return fetchAndStoreProfile(key, "cache_miss");
}

async function refreshProfile(handle) {
  const key = normalizeHandle(handle);
  cacheService.remove(key);

  return fetchAndStoreProfile(key, "fresh_fetch");
}

async function fetchAndStoreProfile(key, source) {
  metricsService.increment("freshFetches");

  const adapterResults = await Promise.allSettled([
    codeforcesAdapter.fetchProfile(key),
    leetcodeMockAdapter.fetchProfile(key),
    codechefMockAdapter.fetchProfile(key),
  ]);

  const platforms = [];
  const failures = [];

  adapterResults.forEach((result) => {
    if (result.status === "fulfilled") {
      platforms.push(result.value);
    } else {
      failures.push(result.reason);
    }
  });

  if (failures.length > 0) {
    metricsService.increment("externalApiFailures", failures.length);

    const storedProfile = storageService.getProfile(key);
    if (storedProfile) {
      metricsService.increment("staleCacheUses");

      return {
        source: "stale_cache",
        warning: "External API failed. Showing last available stored data.",
        data: storedProfile,
      };
    }
  }

  if (platforms.length === 0) {
    const error = new Error("No platform data is available for this handle");
    error.statusCode = 502;
    throw error;
  }

  const profile = {
    handle: getDisplayHandle(key, platforms),
    platforms,
    summary: buildProfileSummary(platforms),
    lastUpdated: new Date().toISOString(),
  };

  storageService.saveProfile(key, profile);
  cacheService.set(key, profile);

  return {
    source,
    warning: failures.length > 0 ? "Some platform data could not be fetched." : undefined,
    data: profile,
  };
}

function getDisplayHandle(key, platforms) {
  const codeforces = platforms.find((platform) => platform.platform === "codeforces");
  return codeforces?.handle || key;
}

module.exports = {
  getProfile,
  refreshProfile,
};
