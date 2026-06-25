const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");
const profilesFile = path.join(dataDir, "profiles.json");
const metricsFile = path.join(dataDir, "metrics.json");

const defaultMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  freshFetches: 0,
  staleCacheUses: 0,
  externalApiFailures: 0,
  totalResponseTimeMs: 0,
};

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(profilesFile)) {
    writeJson(profilesFile, {});
  }

  if (!fs.existsSync(metricsFile)) {
    writeJson(metricsFile, defaultMetrics);
  }
}

function readJson(filePath, fallback) {
  ensureDataDirectoryOnly();

  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDataDirectoryOnly();
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDataDirectoryOnly() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getProfiles() {
  return readJson(profilesFile, {});
}

function getProfile(key) {
  return getProfiles()[key] || null;
}

function saveProfile(key, profile) {
  const profiles = getProfiles();
  profiles[key] = profile;
  writeJson(profilesFile, profiles);
}

function getRawMetrics() {
  return {
    ...defaultMetrics,
    ...readJson(metricsFile, defaultMetrics),
  };
}

function saveMetrics(metrics) {
  writeJson(metricsFile, {
    ...defaultMetrics,
    ...metrics,
  });
}

module.exports = {
  ensureDataFiles,
  getProfiles,
  getProfile,
  saveProfile,
  getRawMetrics,
  saveMetrics,
};
