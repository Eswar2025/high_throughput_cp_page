const CODEFORCES_API_BASE = "https://codeforces.com/api";

async function fetchProfile(handle) {
  const [users, submissions] = await Promise.all([
    fetchCodeforcesJson(`/user.info?handles=${encodeURIComponent(handle)}`),
    fetchCodeforcesJson(`/user.status?handle=${encodeURIComponent(handle)}`),
  ]);

  const user = users[0];

  if (!user) {
    throw new Error(`Codeforces user not found: ${handle}`);
  }

  return {
    platform: "codeforces",
    handle: user.handle,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "unrated",
    maxRank: user.maxRank || "unrated",
    contribution: user.contribution || 0,
    friendOfCount: user.friendOfCount || 0,
    solvedCount: countUniqueAcceptedProblems(submissions),
    source: "real_api",
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchCodeforcesJson(path) {
  const response = await fetch(`${CODEFORCES_API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Codeforces request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload.status !== "OK") {
    throw new Error(payload.comment || "Codeforces request failed");
  }

  return payload.result;
}

function countUniqueAcceptedProblems(submissions) {
  const acceptedProblems = new Set();

  submissions.forEach((submission) => {
    if (submission.verdict !== "OK" || !submission.problem) {
      return;
    }

    acceptedProblems.add(getProblemKey(submission.problem));
  });

  return acceptedProblems.size;
}

function getProblemKey(problem) {
  const contestPart = problem.contestId || problem.problemsetName || "unknown";
  return `${contestPart}:${problem.index}:${problem.name}`;
}

module.exports = {
  fetchProfile,
};
