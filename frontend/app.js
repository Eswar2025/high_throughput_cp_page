const API_BASE_URL = "http://localhost:5000/api";

const state = {
  currentHandle: "",
  isLoading: false,
};

const elements = {
  searchForm: document.querySelector("#searchForm"),
  handleInput: document.querySelector("#handleInput"),
  searchButton: document.querySelector("#searchButton"),
  refreshButton: document.querySelector("#refreshButton"),
  loadLeaderboardButton: document.querySelector("#loadLeaderboardButton"),
  loadMetricsButton: document.querySelector("#loadMetricsButton"),
  messageBox: document.querySelector("#messageBox"),
  healthBadge: document.querySelector("#healthBadge"),
  sourceBadge: document.querySelector("#sourceBadge"),
  summaryGrid: document.querySelector("#summaryGrid"),
  platformCards: document.querySelector("#platformCards"),
  platformCount: document.querySelector("#platformCount"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  metricsGrid: document.querySelector("#metricsGrid"),
  metricsUpdated: document.querySelector("#metricsUpdated"),
  exampleButtons: document.querySelectorAll(".example-button"),
};

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchProfile();
});

elements.refreshButton.addEventListener("click", () => {
  refreshProfile();
});

elements.loadLeaderboardButton.addEventListener("click", () => {
  loadLeaderboard();
});

elements.loadMetricsButton.addEventListener("click", () => {
  loadMetrics();
});

elements.exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.handleInput.value = button.dataset.handle;
    searchProfile();
  });
});

initializeDashboard();

async function initializeDashboard() {
  await checkHealth();
  await Promise.all([loadLeaderboard(), loadMetrics()]);
}

async function checkHealth() {
  try {
    const result = await requestJson("/health");
    elements.healthBadge.textContent = result.success ? "API Online" : "API Issue";
    elements.healthBadge.className = result.success ? "badge badge-hit" : "badge badge-stale";
  } catch (error) {
    elements.healthBadge.textContent = "API Offline";
    elements.healthBadge.className = "badge badge-stale";
  }
}

async function searchProfile() {
  const handle = getHandle();
  if (!handle) return;

  setLoading(true, "Loading profile...");
  state.currentHandle = handle;

  try {
    const result = await requestJson(`/profile/${encodeURIComponent(handle)}`);
    renderProfile(result);
    showMessage(`Loaded ${result.data.handle} from ${formatSource(result.source)}.`, "success");
    await Promise.all([loadLeaderboard(false), loadMetrics(false)]);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function refreshProfile() {
  const handle = getHandle() || state.currentHandle;
  if (!handle) return;

  setLoading(true, "Refreshing profile...");
  state.currentHandle = handle;

  try {
    const result = await requestJson(`/profile/${encodeURIComponent(handle)}/refresh`, {
      method: "POST",
    });
    renderProfile(result);
    showMessage(`Refreshed ${result.data.handle} from ${formatSource(result.source)}.`, "success");
    await Promise.all([loadLeaderboard(false), loadMetrics(false)]);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function loadLeaderboard(showLoading = true) {
  if (showLoading) {
    elements.leaderboardBody.innerHTML = rowMessage("Loading leaderboard...", 7);
  }

  try {
    const result = await requestJson("/leaderboard");
    renderLeaderboard(result.data || []);
  } catch (error) {
    elements.leaderboardBody.innerHTML = rowMessage(escapeHtml(error.message), 7);
  }
}

async function loadMetrics(showLoading = true) {
  if (showLoading) {
    elements.metricsUpdated.textContent = "Loading";
    elements.metricsGrid.innerHTML = `<div class="empty-state">Loading metrics...</div>`;
  }

  try {
    const result = await requestJson("/metrics");
    renderMetrics(result.data);
  } catch (error) {
    elements.metricsUpdated.textContent = "Error";
    elements.metricsUpdated.className = "badge badge-stale";
    elements.metricsGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function renderProfile(result) {
  const profile = result.data;
  const summary = profile.summary || {};

  elements.sourceBadge.textContent = formatSource(result.source);
  elements.sourceBadge.className = `badge ${getSourceBadgeClass(result.source)}`;

  elements.summaryGrid.innerHTML = [
    statCard(profile.handle, "Handle"),
    statCard(formatNumber(summary.bestRating || 0), "Best Rating"),
    statCard(formatNumber(summary.totalSolved || 0), "Total Solved"),
    statCard(formatNumber(summary.activePlatforms || 0), "Active Platforms"),
  ].join("");

  const platforms = profile.platforms || [];
  elements.platformCount.textContent = `${platforms.length} Platform${platforms.length === 1 ? "" : "s"}`;
  elements.platformCount.className = "badge badge-muted";

  elements.platformCards.innerHTML = platforms.length
    ? platforms.map(platformCard).join("")
    : `<div class="empty-state">No platform data returned.</div>`;
}

function renderLeaderboard(rows) {
  if (!rows.length) {
    elements.leaderboardBody.innerHTML = rowMessage("No searched profiles yet.", 7);
    return;
  }

  elements.leaderboardBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.rank}</td>
          <td>${escapeHtml(row.handle)}</td>
          <td>${formatNumber(row.rating)}</td>
          <td>${formatNumber(row.maxRating)}</td>
          <td>${formatNumber(row.solved)}</td>
          <td><span class="badge ${getSourceBadgeClass(row.source)}">${formatSource(row.source)}</span></td>
          <td>${formatDate(row.lastUpdated)}</td>
        </tr>
      `
    )
    .join("");
}

function renderMetrics(metrics) {
  const cards = [
    ["Total Requests", metrics.totalRequests],
    ["Cache Hits", metrics.cacheHits],
    ["Cache Misses", metrics.cacheMisses],
    ["Fresh Fetches", metrics.freshFetches],
    ["Stale Cache Uses", metrics.staleCacheUses],
    ["API Failures", metrics.externalApiFailures],
    ["Avg Response", `${metrics.averageResponseTimeMs || 0} ms`],
  ];

  elements.metricsGrid.innerHTML = cards
    .map(([label, value]) => statCard(formatNumber(value), label))
    .join("");

  elements.metricsUpdated.textContent = "Updated";
  elements.metricsUpdated.className = "badge badge-hit";
}

function platformCard(platform) {
  return `
    <article class="platform-card">
      <div class="platform-card-header">
        <div>
          <h3>${escapeHtml(platform.platform)}</h3>
          <span class="platform-meta">${escapeHtml(platform.handle)}</span>
        </div>
        <span class="badge ${getSourceBadgeClass(platform.source)}">${formatSource(platform.source)}</span>
      </div>
      <div class="platform-stats">
        <div>
          <strong>${formatNumber(platform.rating)}</strong>
          <span class="platform-meta">Rating</span>
        </div>
        <div>
          <strong>${formatNumber(platform.maxRating)}</strong>
          <span class="platform-meta">Max Rating</span>
        </div>
        <div>
          <strong>${escapeHtml(platform.rank || "unrated")}</strong>
          <span class="platform-meta">Rank</span>
        </div>
        <div>
          <strong>${formatNumber(platform.solvedCount)}</strong>
          <span class="platform-meta">Solved</span>
        </div>
      </div>
      <span class="platform-meta">Last updated ${formatDate(platform.lastUpdated)}</span>
    </article>
  `;
}

function statCard(value, label) {
  return `
    <div class="stat-card">
      <span class="stat-value">${escapeHtml(String(value))}</span>
      <span class="stat-label">${escapeHtml(label)}</span>
    </div>
  `;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

function getHandle() {
  const handle = elements.handleInput.value.trim();

  if (!handle) {
    showMessage("Enter a handle first.", "error");
    return "";
  }

  return handle;
}

function setLoading(isLoading, message = "") {
  state.isLoading = isLoading;
  elements.searchButton.disabled = isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.searchButton.textContent = isLoading ? "Loading..." : "Search";
  elements.refreshButton.textContent = isLoading ? "Working..." : "Refresh";

  if (message) {
    showMessage(message);
  }
}

function showMessage(message, type = "") {
  elements.messageBox.textContent = message;
  elements.messageBox.className = `message ${type}`.trim();
}

function rowMessage(message, colspan) {
  return `
    <tr>
      <td colspan="${colspan}">${message}</td>
    </tr>
  `;
}

function getSourceBadgeClass(source) {
  const classes = {
    cache_hit: "badge-hit",
    cache_miss: "badge-miss",
    fresh_fetch: "badge-fresh",
    stale_cache: "badge-stale",
    real_api: "badge-real",
    mock_data: "badge-mock",
  };

  return classes[source] || "badge-muted";
}

function formatSource(source) {
  if (!source) return "Unknown";
  return source
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value) {
  if (typeof value === "string" && value.endsWith(" ms")) {
    return value;
  }

  return Number(value || 0).toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
