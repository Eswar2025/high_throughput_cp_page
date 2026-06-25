const storageService = require("./storage.service");

function getMetrics() {
  const metrics = storageService.getRawMetrics();

  return {
    ...metrics,
    averageResponseTimeMs:
      metrics.totalRequests === 0
        ? 0
        : Math.round(metrics.totalResponseTimeMs / metrics.totalRequests),
  };
}

function updateMetrics(updater) {
  const metrics = storageService.getRawMetrics();
  updater(metrics);
  storageService.saveMetrics(metrics);
}

function recordRequest(responseTimeMs) {
  updateMetrics((metrics) => {
    metrics.totalRequests += 1;
    metrics.totalResponseTimeMs += responseTimeMs;
  });
}

function increment(field, amount = 1) {
  updateMetrics((metrics) => {
    metrics[field] = (metrics[field] || 0) + amount;
  });
}

module.exports = {
  getMetrics,
  recordRequest,
  increment,
};
