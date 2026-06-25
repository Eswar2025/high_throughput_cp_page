const express = require("express");
const profileRoutes = require("./routes/profile.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const metricsRoutes = require("./routes/metrics.routes");
const rateLimiter = require("./middleware/rateLimiter");
const metricsService = require("./services/metrics.service");
const storageService = require("./services/storage.service");
const { sendSuccess, sendError } = require("./utils/apiResponse");

const app = express();
const PORT = process.env.PORT || 5003;

storageService.ensureDataFiles();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use((req, res, next) => {
  res.locals.startedAt = Date.now();
  const shouldTrackRequest = req.originalUrl.startsWith("/api");

  res.on("finish", () => {
    if (shouldTrackRequest) {
      const responseTimeMs = Date.now() - res.locals.startedAt;
      metricsService.recordRequest(responseTimeMs);
      logRequest(req, res, responseTimeMs);
    }
  });

  next();
});

app.use(rateLimiter);

app.get("/api/health", (req, res) => {
  sendSuccess(res, {
    data: {
      message: "High Throughput CP API is running",
    },
    extra: {
      message: "High Throughput CP API is running",
    },
  });
});

app.use("/api/profile", profileRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/metrics", metricsRoutes);

app.use((req, res) => {
  sendError(res, 404, "ROUTE_NOT_FOUND", "Route not found");
});

app.listen(PORT, () => {
  console.log(`High Throughput CP API running on http://localhost:${PORT}`);
});

function logRequest(req, res, responseTimeMs) {
  const source = res.locals.source ? ` source=${res.locals.source}` : "";
  const error = res.locals.errorCode ? ` error=${res.locals.errorCode}` : "";
  console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${responseTimeMs}ms${source}${error}`);
}
