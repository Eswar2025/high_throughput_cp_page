const metricsService = require("../services/metrics.service");
const { sendSuccess } = require("../utils/apiResponse");

function getMetrics(req, res) {
  sendSuccess(res, {
    data: metricsService.getMetrics(),
  });
}

module.exports = {
  getMetrics,
};
