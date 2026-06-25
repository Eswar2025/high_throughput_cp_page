const storageService = require("../services/storage.service");

function getLeaderboard(req, res) {
  const profiles = storageService.getProfiles();

  const leaderboard = Object.values(profiles)
    .sort((a, b) => {
      const ratingDiff = (b.summary?.bestRating || 0) - (a.summary?.bestRating || 0);
      if (ratingDiff !== 0) return ratingDiff;

      return (b.summary?.totalSolved || 0) - (a.summary?.totalSolved || 0);
    })
    .map((profile, index) => {
      const codeforces = profile.platforms.find((platform) => platform.platform === "codeforces") || {};

      return {
        rank: index + 1,
        handle: profile.handle,
        rating: codeforces.rating || 0,
        maxRating: codeforces.maxRating || 0,
        solved: codeforces.solvedCount || 0,
        bestRating: profile.summary?.bestRating || 0,
        totalSolved: profile.summary?.totalSolved || 0,
        source: codeforces.source || "unknown",
        lastUpdated: profile.lastUpdated,
      };
    });

  res.json({
    success: true,
    count: leaderboard.length,
    data: leaderboard,
  });
}

module.exports = {
  getLeaderboard,
};
