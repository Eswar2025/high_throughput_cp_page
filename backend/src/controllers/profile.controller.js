const profileService = require("../services/profile.service");

async function getProfile(req, res) {
  const startedAt = Date.now();

  try {
    const result = await profileService.getProfile(req.params.handle);

    res.json({
      success: true,
      source: result.source,
      responseTimeMs: Date.now() - startedAt,
      warning: result.warning,
      data: result.data,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch profile",
    });
  }
}

async function refreshProfile(req, res) {
  const startedAt = Date.now();

  try {
    const result = await profileService.refreshProfile(req.params.handle);

    res.json({
      success: true,
      source: result.source,
      responseTimeMs: Date.now() - startedAt,
      warning: result.warning,
      data: result.data,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to refresh profile",
    });
  }
}

module.exports = {
  getProfile,
  refreshProfile,
};
