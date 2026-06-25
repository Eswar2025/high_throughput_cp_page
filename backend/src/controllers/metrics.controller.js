const metricsService = require("../services/metrics.service");

function getMetrics(req, res) {
  res.json({
    success: true,
    data: metricsService.getMetrics(),
  });
}

module.exports = {
  getMetrics,
};
