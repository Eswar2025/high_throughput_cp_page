const express = require("express");
const profileRoutes = require("./routes/profile.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const metricsRoutes = require("./routes/metrics.routes");
const metricsService = require("./services/metrics.service");
const storageService = require("./services/storage.service");

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
  const startedAt = Date.now();
  const shouldTrackRequest = req.originalUrl.startsWith("/api");
  const sendJson = res.json.bind(res);

  res.json = (body) => {
    if (shouldTrackRequest) {
      metricsService.recordRequest(Date.now() - startedAt);
    }

    return sendJson(body);
  };

  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "High Throughput CP API is running",
  });
});

app.use("/api/profile", profileRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/metrics", metricsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`High Throughput CP API running on http://localhost:${PORT}`);
});
