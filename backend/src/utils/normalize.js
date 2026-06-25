function normalizeHandle(handle) {
  const normalizedHandle = String(handle || "").trim().toLowerCase();

  if (!normalizedHandle) {
    throwValidationError("Handle is required.");
  }

  if (!/^[a-z0-9_.-]+$/.test(normalizedHandle)) {
    throwValidationError(
      "Handle can only contain letters, numbers, underscore, hyphen, and dot."
    );
  }

  return normalizedHandle;
}

function throwValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "INVALID_HANDLE";
  throw error;
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
