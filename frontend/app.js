const API_BASE_URL = "http://localhost:5003/api";
const RECENT_HANDLES_KEY = "cp_metrics_recent_handles";

const state = {
  currentHandle: "",
  isLoading: false,
  recentHandles: loadRecentHandles(),
};

const elements = {
  apiBaseLabel: document.querySelector("#apiBaseLabel"),
  searchForm: document.querySelector("#searchForm"),
  handleInput: document.querySelector("#handleInput"),
  searchButton: document.querySelector("#searchButton"),
  refreshButton: document.querySelector("#refreshButton"),
  actionsDropdown: document.querySelector("#actionsDropdown"),
  loadLeaderboardButton: document.querySelector("#loadLeaderboardButton"),
  loadMetricsButton: document.querySelector("#loadMetricsButton"),
  clearResultsButton: document.querySelector("#clearResultsButton"),
  messageBox: document.querySelector("#messageBox"),
  healthBadge: document.querySelector("#healthBadge"),
  sourceBadge: document.querySelector("#sourceBadge"),
  cacheProviderBadge: document.querySelector("#cacheProviderBadge"),
  profileOverview: document.querySelector("#profileOverview"),
  platformCards: document.querySelector("#platformCards"),
  platformCount: document.querySelector("#platformCount"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  metricsGrid: document.querySelector("#metricsGrid"),
  metricsUpdated: document.querySelector("#metricsUpdated"),
  historyList: document.querySelector("#historyList"),
  exampleButtons: document.querySelectorAll(".example-button"),
};

elements.apiBaseLabel.textContent = API_BASE_URL;

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchProfile();
});

elements.refreshButton.addEventListener("click", () => {
  refreshProfile();
});

elements.loadLeaderboardButton.addEventListener("click", () => {
  if (state.isLoading) return;
  closeActionsMenu();
  loadLeaderboard();
});

elements.loadMetricsButton.addEventListener("click", () => {
  if (state.isLoading) return;
  closeActionsMenu();
  loadMetrics();
});

elements.clearResultsButton.addEventListener("click", () => {
  if (state.isLoading) return;
  closeActionsMenu();
  clearResults();
});

elements.exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.handleInput.value = button.dataset.handle;
    searchProfile();
  });
});

elements.historyList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-history-handle]");
  if (!button || state.isLoading) return;

  elements.handleInput.value = button.dataset.historyHandle;
  searchProfile();
});

document.addEventListener("click", (event) => {
  if (!elements.actionsDropdown.contains(event.target)) {
    closeActionsMenu();
  }
});

initializeDashboard();

async function initializeDashboard() {
  renderHistory();
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
    showMessage("Backend is offline. Start the Express API before searching.", "error");
  }
}

async function searchProfile() {
  const handle = getHandle();
  if (!handle) return;

  setLoading(true, "Loading profile data...");
  state.currentHandle = handle;

  try {
    const result = await requestJson(`/profile/${encodeURIComponent(handle)}`);
    renderProfile(result);
    addRecentHandle(result.data?.handle || handle);
    showStatusMessage(result, "Loaded");
    await Promise.all([loadLeaderboard(false), loadMetrics(false)]);
  } catch (error) {
    showError(error);
  } finally {
    setLoading(false);
  }
}

async function refreshProfile() {
  const handle = getHandle() || state.currentHandle;
  if (!handle) return;

  setLoading(true, "Refreshing profile data...");
  state.currentHandle = handle;

  try {
    const result = await requestJson(`/profile/${encodeURIComponent(handle)}/refresh`, {
      method: "POST",
    });
    renderProfile(result);
    addRecentHandle(result.data?.handle || handle);
    showStatusMessage(result, "Refreshed");
    await Promise.all([loadLeaderboard(false), loadMetrics(false)]);
  } catch (error) {
    showError(error);
  } finally {
    setLoading(false);
  }
}

async function loadLeaderboard(showLoading = true) {
  if (showLoading) {
    elements.leaderboardBody.innerHTML = rowMessage("Loading...", 8);
  }

  try {
    const result = await requestJson("/leaderboard");
    renderLeaderboard(result.data || []);
  } catch (error) {
    elements.leaderboardBody.innerHTML = rowMessage(escapeHtml(getErrorMessage(error)), 8);
  }
}

async function loadMetrics(showLoading = true) {
  if (showLoading) {
    elements.metricsUpdated.textContent = "Loading";
    elements.metricsUpdated.className = "badge badge-fresh";
    elements.metricsGrid.innerHTML = `<div class="empty-state">Loading...</div>`;
  }

  try {
    const result = await requestJson("/metrics");
    renderMetrics(result.data || {});
  } catch (error) {
    elements.metricsUpdated.textContent = "Error";
    elements.metricsUpdated.className = "badge badge-stale";
    elements.metricsGrid.innerHTML = `<div class="empty-state">${escapeHtml(getErrorMessage(error))}</div>`;
  }
}

function renderProfile(result) {
  const profile = result.data || {};
  const summary = profile.summary || {};
  const platforms = profile.platforms || [];
  const lastUpdated = profile.lastUpdated || getLatestPlatformUpdate(platforms);
  const source = result.source || "unknown";
  const cacheProvider = result.cacheProvider || "memory";

  elements.sourceBadge.textContent = formatSource(source);
  elements.sourceBadge.className = `badge ${getBadgeClass(source)}`;
  elements.cacheProviderBadge.textContent = formatSource(cacheProvider);
  elements.cacheProviderBadge.className = `badge ${getBadgeClass(cacheProvider)}`;

  elements.profileOverview.innerHTML = `
    <article class="profile-card-shell">
      <div class="profile-topline">
        <div class="profile-handle">
          <span class="profile-avatar">${escapeHtml(getHandleInitials(profile.handle || "CP"))}</span>
          <div>
            <strong>${escapeHtml(profile.handle || "Unknown")}</strong>
            <span>Competitive programming profile</span>
          </div>
        </div>
        <div class="badge-row">
          <span class="badge ${getBadgeClass(source)}">${formatSource(source)}</span>
          <span class="badge ${getBadgeClass(cacheProvider)}">${formatSource(cacheProvider)}</span>
        </div>
      </div>

      <div class="profile-main-grid">
        ${profileMainStat(profile.handle || "Unknown", "Handle")}
        ${profileMainStat(formatNumber(summary.bestRating || 0), "Best Rating")}
        ${profileMainStat(formatNumber(summary.totalSolved || 0), "Total Solved")}
        ${profileMainStat(formatNumber(summary.activePlatforms || 0), "Active Platforms")}
      </div>

      <div class="profile-mini-stats">
        ${profileMiniBadge(source, "Source")}
        ${profileMiniBadge(cacheProvider, "Cache Provider")}
        ${profileMiniStat(`${result.responseTimeMs || 0} ms`, "Response Time")}
      </div>

      ${result.warning ? warningBox(result.warning) : ""}

      <span class="profile-footer">Last updated: ${formatDate(lastUpdated)}</span>
    </article>
  `;

  elements.platformCount.textContent = `${platforms.length} Platform${platforms.length === 1 ? "" : "s"}`;
  elements.platformCount.className = "badge badge-muted";

  elements.platformCards.innerHTML = platforms.length
    ? platforms.map(platformCard).join("")
    : `<div class="empty-state">No platform data returned.</div>`;
}

function renderLeaderboard(rows) {
  if (!rows.length) {
    elements.leaderboardBody.innerHTML = rowMessage("Search profiles to build the leaderboard.", 8);
    return;
  }

  elements.leaderboardBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.rank}</td>
          <td><strong>${escapeHtml(row.handle)}</strong></td>
          <td>${formatNumber(row.rating)}</td>
          <td>${formatNumber(row.maxRating)}</td>
          <td>${formatNumber(row.solved)}</td>
          <td>${formatNumber(row.totalSolved)}</td>
          <td><span class="badge ${getBadgeClass(row.source)}">${formatSource(row.source)}</span></td>
          <td>${formatDate(row.lastUpdated)}</td>
        </tr>
      `
    )
    .join("");
}

function renderMetrics(metrics) {
  const cards = [
    ["Total Requests", metrics.totalRequests, ""],
    ["Cache Hits", metrics.cacheHits, "metric-highlight"],
    ["Cache Misses", metrics.cacheMisses, "metric-highlight"],
    ["Fresh Fetches", metrics.freshFetches, ""],
    ["Stale Cache Uses", metrics.staleCacheUses, ""],
    ["External API Failures", metrics.externalApiFailures, ""],
    ["Rate Limited", metrics.rateLimitedRequests, "metric-highlight"],
    ["Avg Response", `${metrics.averageResponseTimeMs || 0} ms`, "metric-highlight"],
  ];

  elements.metricsGrid.innerHTML = cards
    .map(([label, value, className]) => statCard(formatMetricValue(value), label, className))
    .join("");

  elements.metricsUpdated.textContent = "Updated";
  elements.metricsUpdated.className = "badge badge-hit";
}

function renderHistory() {
  if (!state.recentHandles.length) {
    elements.historyList.innerHTML = `<div class="empty-state">Recent handles will appear after a successful search.</div>`;
    return;
  }

  elements.historyList.innerHTML = state.recentHandles
    .map(
      (handle) => `
        <button class="history-chip" type="button" data-history-handle="${escapeHtml(handle)}">
          ${escapeHtml(handle)}
        </button>
      `
    )
    .join("");
}

function platformCard(platform) {
  return `
    <article class="platform-card">
      <div class="platform-card-header">
        <div>
          <h3>${escapeHtml(platform.platform || "platform")}</h3>
          <span class="platform-meta">${escapeHtml(platform.handle || "unknown")}</span>
        </div>
        <span class="badge ${getBadgeClass(platform.source)}">${formatSource(platform.source)}</span>
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
          <span class="platform-meta">Solved Count</span>
        </div>
      </div>
      <span class="platform-meta">Last updated ${formatDate(platform.lastUpdated)}</span>
    </article>
  `;
}

function statCard(value, label, className = "") {
  return `
    <article class="stat-card ${escapeHtml(className)}">
      <span class="stat-value">${escapeHtml(String(value))}</span>
      <span class="stat-label">${escapeHtml(label)}</span>
    </article>
  `;
}

function profileMainStat(value, label) {
  return `
    <div class="profile-main-stat">
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function profileMiniStat(value, label) {
  return `
    <div class="profile-mini-card">
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function profileMiniBadge(source, label) {
  return `
    <div class="profile-mini-card">
      <span class="badge ${getBadgeClass(source)}">${formatSource(source)}</span>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function warningBox(message) {
  return `<div class="warning-box">${escapeHtml(message)}</div>`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error?.message || payload.message || "Request failed");
    error.status = response.status;
    error.code = payload.error?.code || "REQUEST_FAILED";
    throw error;
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
  elements.loadLeaderboardButton.disabled = isLoading;
  elements.loadMetricsButton.disabled = isLoading;
  elements.clearResultsButton.disabled = isLoading;
  elements.actionsDropdown.classList.toggle("is-disabled", isLoading);
  elements.searchButton.textContent = isLoading ? "Loading..." : "Search";

  if (isLoading) {
    closeActionsMenu();
  }

  if (message) {
    showMessage(message, "loading");
  }
}

function showStatusMessage(result, action) {
  const handle = result.data?.handle || state.currentHandle || "profile";
  const cacheProvider = result.cacheProvider || "memory";
  const source = result.source || "unknown";
  const responseTime = `${result.responseTimeMs || 0} ms`;

  elements.messageBox.innerHTML = `
    <div class="message-content">
      <span>
        ${escapeHtml(action)} <strong>${escapeHtml(handle)}</strong> from
        ${escapeHtml(formatSource(cacheProvider))} cache in ${escapeHtml(responseTime)}.
      </span>
      <span class="message-badges">
        <span class="badge ${getBadgeClass(source)}">${formatSource(source)}</span>
        <span class="badge ${getBadgeClass(cacheProvider)}">${formatSource(cacheProvider)}</span>
      </span>
    </div>
  `;
  elements.messageBox.className = "message success";
}

function showError(error) {
  const message = error.status === 429
    ? "Rate limit reached. Please wait a minute before trying again."
    : getErrorMessage(error);

  showMessage(message, "error");
}

function showMessage(message, type = "") {
  elements.messageBox.textContent = message;
  elements.messageBox.className = `message ${type}`.trim();
}

function clearResults() {
  state.currentHandle = "";
  elements.handleInput.value = "";
  elements.sourceBadge.textContent = "No Search Yet";
  elements.sourceBadge.className = "badge badge-muted";
  elements.cacheProviderBadge.textContent = "Cache Provider";
  elements.cacheProviderBadge.className = "badge badge-muted";
  elements.profileOverview.innerHTML = `<div class="empty-state">Search a handle to load the profile overview.</div>`;
  elements.platformCount.textContent = "0 Platforms";
  elements.platformCount.className = "badge badge-muted";
  elements.platformCards.innerHTML = `<div class="empty-state">Platform cards will appear after a successful search.</div>`;
  elements.leaderboardBody.innerHTML = rowMessage("Search profiles to build the leaderboard.", 8);
  elements.metricsUpdated.textContent = "Waiting";
  elements.metricsUpdated.className = "badge badge-muted";
  elements.metricsGrid.innerHTML = `<div class="empty-state">Metrics will load from the backend.</div>`;
  showMessage("Results cleared. Search a handle to load fresh dashboard data.", "success");
}

function addRecentHandle(handle) {
  const cleanedHandle = String(handle || "").trim();
  if (!cleanedHandle) return;

  state.recentHandles = [
    cleanedHandle,
    ...state.recentHandles.filter((item) => item.toLowerCase() !== cleanedHandle.toLowerCase()),
  ].slice(0, 8);

  saveRecentHandles();
  renderHistory();
}

function loadRecentHandles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_HANDLES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 8) : [];
  } catch (error) {
    return [];
  }
}

function saveRecentHandles() {
  try {
    localStorage.setItem(RECENT_HANDLES_KEY, JSON.stringify(state.recentHandles));
  } catch (error) {
    // Local storage is optional for the demo; the dashboard still works without it.
  }
}

function closeActionsMenu() {
  elements.actionsDropdown.open = false;
}

function rowMessage(message, colspan) {
  return `
    <tr>
      <td colspan="${colspan}">${message}</td>
    </tr>
  `;
}

function getBadgeClass(source) {
  const classes = {
    cache_hit: "badge-hit",
    cache_miss: "badge-miss",
    fresh_fetch: "badge-fresh",
    stale_cache: "badge-stale",
    redis: "badge-redis",
    memory: "badge-memory",
    real_api: "badge-real",
    mock_data: "badge-mock",
  };

  return classes[source] || "badge-muted";
}

function formatSource(source) {
  if (!source) return "Unknown";
  return String(source)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatMetricValue(value) {
  if (typeof value === "string" && value.endsWith(" ms")) {
    return value;
  }

  return formatNumber(value);
}

function getLatestPlatformUpdate(platforms) {
  const updates = platforms
    .map((platform) => platform.lastUpdated)
    .filter(Boolean)
    .sort();

  return updates[updates.length - 1];
}

function getHandleInitials(handle) {
  return String(handle)
    .trim()
    .slice(0, 2)
    .toUpperCase();
}

function getErrorMessage(error) {
  if (error.code && error.message) {
    return `${error.code}: ${error.message}`;
  }

  return error.message || "Something went wrong.";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
