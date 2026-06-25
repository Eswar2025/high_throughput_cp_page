function fetchProfile(handle) {
  const seed = getSeed(handle);

  return Promise.resolve({
    platform: "leetcode",
    handle,
    rating: 1500 + (seed % 700),
    maxRating: 1600 + (seed % 800),
    rank: "mock_rank",
    maxRank: "mock_rank",
    contribution: 0,
    friendOfCount: 0,
    solvedCount: 120 + (seed % 380),
    source: "mock_data",
    lastUpdated: new Date().toISOString(),
  });
}

function getSeed(handle) {
  return handle.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

module.exports = {
  fetchProfile,
};
