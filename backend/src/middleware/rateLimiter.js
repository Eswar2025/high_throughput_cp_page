const metricsService = require("../services/metrics.service");
const { sendError } = require("../utils/apiResponse");

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;
const requestsByIp = new Map();

function rateLimiter(req, res, next) {
  if (!req.originalUrl.startsWith("/api")) {
    return next();
  }

  const now = Date.now();
  const ip = getClientIp(req);
  const current = requestsByIp.get(ip);

  if (!current || now > current.resetAt) {
    requestsByIp.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return next();
  }

  current.count += 1;

  if (current.count > MAX_REQUESTS) {
    metricsService.increment("rateLimitedRequests");
    res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));

    return sendError(
      res,
      429,
      "RATE_LIMITED",
      "Too many requests. Please try again in a minute."
    );
  }

  return next();
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

module.exports = rateLimiter;
