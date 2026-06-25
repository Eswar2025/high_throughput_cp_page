function normalizeHandle(handle) {
  const normalizedHandle = String(handle || "").trim().toLowerCase();

  if (!normalizedHandle) {
    const error = new Error("Handle is required");
    error.statusCode = 400;
    throw error;
  }

  return normalizedHandle;
}

function buildProfileSummary(platforms) {
  return {
    bestRating: Math.max(...platforms.map((platform) => platform.rating || 0), 0),
    totalSolved: platforms.reduce((total, platform) => total + (platform.solvedCount || 0), 0),
    activePlatforms: platforms.length,
  };
}

module.exports = {
  normalizeHandle,
  buildProfileSummary,
};
