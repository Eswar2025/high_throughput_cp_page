const profileService = require("../services/profile.service");
const { sendSuccess, sendError } = require("../utils/apiResponse");

async function getProfile(req, res) {
  try {
    const result = await profileService.getProfile(req.params.handle);

    sendSuccess(res, {
      source: result.source,
      warning: result.warning,
      data: result.data,
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.code || "PROFILE_FETCH_FAILED",
      error.message || "Unable to fetch profile"
    );
  }
}

async function refreshProfile(req, res) {
  try {
    const result = await profileService.refreshProfile(req.params.handle);

    sendSuccess(res, {
      source: result.source,
      warning: result.warning,
      data: result.data,
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.code || "PROFILE_REFRESH_FAILED",
      error.message || "Unable to refresh profile"
    );
  }
}

module.exports = {
  getProfile,
  refreshProfile,
};
