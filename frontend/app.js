const LOCAL_API_BASE_URL = "https://cp-hub-backend-qxjb.onrender.com/api";
const PRODUCTION_API_BASE_URL = "https://cp-hub-backend-qxjb.onrender.com/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const isLocalDevelopment =
  window.location.protocol === "file:" || LOCAL_HOSTNAMES.has(window.location.hostname);
const API_BASE_URL = isLocalDevelopment ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
const RECENT_HANDLES_KEY = "cp_metrics_recent_handles";

const state = {
  currentHandle: "",
  isLoading: false,
  recentHandles: loadRecentHandles(),
  searchPlatform: "codeforces",
  leaderboardPlatform: "overall",
  overallLeaderboardRows: [],
  searchedProfiles: new Map(),
  currentProfileResult: null,
  metricsExpanded: true,
};

const elements = {
  apiBaseLabel: document.querySelector("#apiBaseLabel"),
  searchForm: document.querySelector("#searchForm"),
  handleInput: document.querySelector("#handleInput"),
  searchButton: document.querySelector("#searchButton"),
  platformSelect: document.querySelector("#platformSelect"),
  platformContextNote: document.querySelector("#platformContextNote"),
  refreshButton: document.querySelector("#refreshButton"),
  actionsDropdown: document.querySelector("#actionsDropdown"),
  loadLeaderboardButton: document.querySelector("#loadLeaderboardButton"),
  loadMetricsButton: document.querySelector("#loadMetricsButton"),
  clearResultsButton: document.querySelector("#clearResultsButton"),
  messageBox: document.querySelector("#messageBox"),
  healthBadge: document.querySelector("#healthBadge"),
  profileOverview: document.querySelector("#profileOverview"),
  platformCards: document.querySelector("#platformCards"),
  platformCount: document.querySelector("#platformCount"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  metricsGrid: document.querySelector("#metricsGrid"),
  metricsUpdated: document.querySelector("#metricsUpdated"),
  metricsToggle: document.querySelector("#metricsToggle"),
  metricsToggleLabel: document.querySelector("#metricsToggleLabel"),
  leaderboardTabs: document.querySelector("#leaderboardTabs"),
  leaderboardTabButtons: document.querySelectorAll("[data-leaderboard-platform]"),
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

elements.platformSelect.addEventListener("change", () => {
  state.searchPlatform = elements.platformSelect.value;
  updatePlatformContext();

  if (state.currentProfileResult) {
    renderPlatformCards(state.currentProfileResult.data?.platforms || []);
  }
});

elements.loadLeaderboardButton.addEventListener("click", () => {
  if (state.isLoading) return;
  closeActionsMenu();
  loadLeaderboard();
});

elements.loadMetricsButton.addEventListener("click", () => {
  if (state.isLoading) return;
  closeActionsMenu();
  setMetricsExpanded(true);
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

elements.metricsToggle.addEventListener("click", () => {
  setMetricsExpanded(!state.metricsExpanded);
});

elements.leaderboardTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-leaderboard-platform]");
  if (!button) return;

  state.leaderboardPlatform = button.dataset.leaderboardPlatform;
  updateLeaderboardTabs();
  renderLeaderboard();
});

document.addEventListener("click", (event) => {
  if (!elements.actionsDropdown.contains(event.target)) {
    closeActionsMenu();
  }
});

initializeDashboard();

async function initializeDashboard() {
  state.searchPlatform = elements.platformSelect.value;
  updatePlatformContext();
  setMetricsExpanded(true);
  updateLeaderboardTabs();
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
  if (showLoading && state.leaderboardPlatform === "overall") {
    elements.leaderboardBody.innerHTML = rowMessage("Loading...", 8);
  }

  try {
    const result = await requestJson("/leaderboard");
    state.overallLeaderboardRows = result.data || [];
    renderLeaderboard();
  } catch (error) {
    if (state.leaderboardPlatform === "overall") {
      elements.leaderboardBody.innerHTML = rowMessage(escapeHtml(getErrorMessage(error)), 8);
    }
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

  state.currentProfileResult = result;

  if (profile.handle) {
    state.searchedProfiles.set(String(profile.handle).toLowerCase(), profile);
  }

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
  renderPlatformCards(platforms);

  if (state.leaderboardPlatform !== "overall") {
    renderLeaderboard();
  }
}

function renderLeaderboard() {
  const isOverall = state.leaderboardPlatform === "overall";
  const rows = isOverall
    ? state.overallLeaderboardRows
    : buildPlatformLeaderboard(state.leaderboardPlatform);

  if (!rows.length) {
    const message = isOverall
      ? "Search profiles to build the leaderboard."
      : "Search profiles to build this platform leaderboard.";
    elements.leaderboardBody.innerHTML = rowMessage(message, 8);
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

function buildPlatformLeaderboard(platformName) {
  const normalizedPlatform = String(platformName).toLowerCase();

  return Array.from(state.searchedProfiles.values())
    .map((profile) => {
      const platform = (profile.platforms || []).find(
        (item) => String(item.platform).toLowerCase() === normalizedPlatform
      );

      if (!platform) return null;

      return {
        handle: platform.handle || profile.handle,
        rating: platform.rating || 0,
        maxRating: platform.maxRating || 0,
        solved: platform.solvedCount || 0,
        totalSolved: profile.summary?.totalSolved || platform.solvedCount || 0,
        source: platform.source || "unknown",
        lastUpdated: platform.lastUpdated || profile.lastUpdated,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.maxRating - a.maxRating ||
        b.solved - a.solved ||
        String(a.handle).localeCompare(String(b.handle))
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function renderMetrics(metrics) {
  const cards = [
    ["Total Requests", metrics.totalRequests, ""],
    ["Cache Hits", metrics.cacheHits, "metric-accent-green"],
    ["Cache Misses", metrics.cacheMisses, "metric-accent-amber"],
    ["Fresh Fetches", metrics.freshFetches, ""],
    ["Stale Cache Uses", metrics.staleCacheUses, ""],
    ["External API Failures", metrics.externalApiFailures, ""],
    ["Rate Limited", metrics.rateLimitedRequests, "metric-accent-red"],
    ["Avg Response", `${metrics.averageResponseTimeMs || 0} ms`, "metric-accent-blue"],
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

function renderPlatformCards(platforms) {
  elements.platformCards.innerHTML = platforms.length
    ? platforms.map(platformCard).join("")
    : `<div class="empty-state">No platform data returned.</div>`;
}

function platformCard(platform) {
  const platformName = String(platform.platform || "").toLowerCase();
  const isSelected =
    state.searchPlatform !== "all" && platformName === state.searchPlatform;

  return `
    <article class="platform-card${isSelected ? " is-context-selected" : ""}">
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
  elements.platformSelect.disabled = isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.loadLeaderboardButton.disabled = isLoading;
  elements.loadMetricsButton.disabled = isLoading;
  elements.clearResultsButton.disabled = isLoading;
  elements.actionsDropdown.classList.toggle("is-disabled", isLoading);
  elements.searchButton.setAttribute("aria-label", isLoading ? "Loading profile" : "Search profile");
  elements.searchButton.title = isLoading ? "Loading profile" : "Search profile";

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
  state.currentProfileResult = null;
  state.searchedProfiles.clear();
  state.overallLeaderboardRows = [];
  elements.handleInput.value = "";
  elements.profileOverview.innerHTML = `<div class="empty-state">Search a handle to load the profile overview.</div>`;
  elements.platformCount.textContent = "0 Platforms";
  elements.platformCount.className = "badge badge-muted";
  elements.platformCards.innerHTML = `<div class="empty-state">Platform cards will appear after a successful search.</div>`;
  renderLeaderboard();
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

function updatePlatformContext() {
  const messages = {
    codeforces:
      "Use a Codeforces handle to populate the profile, platform cards, leaderboard, and metrics.",
    leetcode:
      "LeetCode currently uses mock adapter data. Search still loads the existing combined profile.",
    codechef:
      "CodeChef currently uses mock adapter data. Search still loads the existing combined profile.",
    all:
      "All Platforms combines Codeforces real API data with clearly labeled LeetCode and CodeChef mock data.",
  };

  elements.platformContextNote.textContent = messages[state.searchPlatform] || messages.codeforces;
}

function setMetricsExpanded(isExpanded) {
  state.metricsExpanded = isExpanded;
  elements.metricsGrid.hidden = !isExpanded;
  elements.metricsToggle.setAttribute("aria-expanded", String(isExpanded));
  elements.metricsToggleLabel.textContent = isExpanded ? "Hide Metrics" : "Show Metrics";
  elements.metricsToggle.classList.toggle("is-collapsed", !isExpanded);
}

function updateLeaderboardTabs() {
  elements.leaderboardTabButtons.forEach((button) => {
    const isActive = button.dataset.leaderboardPlatform === state.leaderboardPlatform;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
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
