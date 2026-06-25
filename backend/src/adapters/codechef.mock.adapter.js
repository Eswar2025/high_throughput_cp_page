function fetchProfile(handle) {
  const seed = getSeed(handle);

  return Promise.resolve({
    platform: "codechef",
    handle,
    rating: 1400 + (seed % 650),
    maxRating: 1500 + (seed % 700),
    rank: "mock_rank",
    maxRank: "mock_rank",
    contribution: 0,
    friendOfCount: 0,
    solvedCount: 80 + (seed % 260),
    source: "mock_data",
    lastUpdated: new Date().toISOString(),
  });
}

function getSeed(handle) {
  return handle.split("").reduce((total, char) => total + char.charCodeAt(0), 17);
}

module.exports = {
  fetchProfile,
};
