const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "High Throughput CP API is running",
  });
});

app.listen(PORT, () => {
  console.log(`High Throughput CP API running on http://localhost:${PORT}`);
});
