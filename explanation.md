# High Throughput CP Page - Full Codebase Explanation

This file explains the project in simple language so you can read the codebase and understand what each part is doing.

## 1. Project Motive

The motive of this project is to build a small but strong full-stack prototype for competitive programming profile metrics.

In real life, if a coding club, hackathon team, or placement group wants to check many student profiles, they may repeatedly call external websites like Codeforces. Directly calling external APIs again and again can be slow and unreliable.

This project solves that problem by:

- taking a competitive programming handle like `tourist`
- fetching public profile data from Codeforces
- adding mock LeetCode and CodeChef data to show multi-platform design
- caching repeated searches so the second request is faster
- storing searched profiles in JSON files
- creating a leaderboard from stored profiles
- tracking metrics like cache hits, misses, requests, and response time
- showing all of this on a simple vanilla HTML/CSS/JS dashboard

The project is intentionally simple. It does not use React, TypeScript, Redis, a database, authentication, or Docker. This makes it easier to explain in interviews.

## 2. Main Project Modules

The project has three main areas:

```txt
frontend/
backend/
docs/
```

The important working parts are:

```txt
frontend/
  index.html
  styles.css
  app.js

backend/
  package.json
  src/
    server.js
    routes/
    controllers/
    services/
    adapters/
    utils/
  data/
    profiles.json
    metrics.json
```

### Frontend Module

The frontend is the dashboard the user sees in the browser.

It is built with:

- HTML for page structure
- CSS for layout and visual styling
- JavaScript for API calls and dynamic updates
- Tailwind CSS CDN included in `index.html`

The frontend does not calculate Codeforces data by itself. It only asks the backend for data and displays the response.

### Backend Module

The backend is an Express.js API server.

It is built with:

- Node.js
- Express.js
- plain JavaScript
- in-memory cache using `Map`
- JSON file storage

The backend is responsible for:

- receiving API requests from the frontend
- calling the Codeforces public API
- calculating solved problem count
- returning profile data
- caching profile data for 300 seconds
- storing profiles in JSON files
- creating leaderboard data
- tracking metrics

### Docs Module

The docs folder currently has starter documentation files:

- `docs/architecture.md`
- `docs/interview-notes.md`
- `docs/load-test-results.md`

These are placeholders for future writeups.

## 3. What Is Express?

Express is a small web framework for Node.js.

Node.js lets JavaScript run outside the browser. Express helps Node.js create API routes.

For example, this route:

```js
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "High Throughput CP API is running",
  });
});
```

means:

- when someone opens `/api/health`
- the backend sends JSON as the response
- the frontend or browser can read that JSON

So Express is the thing that lets our backend listen for requests like:

```txt
GET /api/profile/tourist
GET /api/leaderboard
GET /api/metrics
```

## 4. What Is A Port?

A port is like a door number on your computer.

Your computer is `localhost`. Different apps can run on different ports.

Example:

```txt
http://localhost:5000
http://localhost:5003
http://localhost:5500
```

These are all local addresses on your same machine, but each port points to a different running program.

### Frontend Live Server Port

When you open `frontend/index.html` using VS Code Live Server, it may run on a port like:

```txt
http://127.0.0.1:5500
```

or:

```txt
http://localhost:5500
```

That port is only for serving the frontend files.

### Backend Express Port

The backend Express app runs separately using:

```powershell
npm start
```

In `backend/src/server.js`, this line decides the backend port:

```js
const PORT = process.env.PORT || 5003;
```

That means:

- if you manually set an environment variable named `PORT`, Express uses that
- otherwise, Express uses `5003`

Important note: `frontend/app.js` currently has:

```js
const API_BASE_URL = "http://localhost:5000/api";
```

So for the frontend to call the backend correctly, the backend must be running on the same port used in `API_BASE_URL`.

You have two options:

Option 1: Run backend on port `5000`.

```powershell
$env:PORT=5000
npm start
```

Option 2: Change `frontend/app.js` to use port `5003`.

```js
const API_BASE_URL = "http://localhost:5003/api";
```

When you saw the frontend working, it means the frontend JavaScript was successfully calling whichever backend port matched `API_BASE_URL`.

## 5. How Our Architecture Was Created

The architecture is split into layers:

```txt
Browser UI
  -> frontend/app.js fetch()
  -> Express routes
  -> controllers
  -> services
  -> adapters / cache / storage
  -> JSON response back to frontend
```

### Why Split Into Layers?

We split the backend into folders so each file has one simple job.

- Routes decide which controller handles a URL.
- Controllers handle request and response.
- Services contain main business logic.
- Adapters talk to external platforms like Codeforces.
- Storage reads and writes JSON files.
- Cache stores temporary data in memory.
- Utils contain helper functions.

This makes the code easier to explain and easier to extend later.

## 6. Full Request Flow

Example: user searches `tourist`.

### Step 1: User interacts with frontend

The user types:

```txt
tourist
```

and clicks `Search`.

### Step 2: Frontend JavaScript sends request

`frontend/app.js` calls:

```txt
GET http://localhost:5000/api/profile/tourist
```

or whichever backend port is configured in `API_BASE_URL`.

### Step 3: Express receives request

`backend/src/server.js` receives the request and sends it to:

```txt
backend/src/routes/profile.routes.js
```

### Step 4: Route sends request to controller

`profile.routes.js` maps:

```txt
GET /:handle
```

to:

```txt
profileController.getProfile
```

### Step 5: Controller calls service

`profile.controller.js` calls:

```js
profileService.getProfile(req.params.handle)
```

### Step 6: Service checks cache

`profile.service.js` checks the in-memory cache.

If the profile is already in cache and not expired:

```txt
source: "cache_hit"
```

If not found in cache:

```txt
source: "cache_miss"
```

### Step 7: Service calls platform adapters

If cache misses, the backend fetches platform data using:

```js
Promise.allSettled([
  codeforcesAdapter.fetchProfile(key),
  leetcodeMockAdapter.fetchProfile(key),
  codechefMockAdapter.fetchProfile(key),
]);
```

This means all three platform calls run together.

`Promise.allSettled()` is useful because one platform can fail without crashing the whole profile request.

### Step 8: Codeforces adapter calls real Codeforces API

`codeforces.adapter.js` calls:

```txt
https://codeforces.com/api/user.info
https://codeforces.com/api/user.status
```

It extracts:

- handle
- rating
- maxRating
- rank
- maxRank
- contribution
- friendOfCount
- solvedCount

The solved count is calculated by checking accepted submissions and counting unique problems only.

### Step 9: Mock adapters return fake platform data

LeetCode and CodeChef are mock adapters for now.

They return believable sample data and clearly include:

```js
source: "mock_data"
```

This shows the adapter design without depending on unstable APIs.

### Step 10: Service creates final profile object

The backend combines all platform data into one object:

```js
{
  handle,
  platforms,
  summary,
  lastUpdated
}
```

The summary includes:

- bestRating
- totalSolved
- activePlatforms

### Step 11: Backend stores data

The profile is saved into:

```txt
backend/data/profiles.json
```

Metrics are saved into:

```txt
backend/data/metrics.json
```

### Step 12: Backend sends JSON response

The backend returns JSON to the frontend.

Example response shape:

```json
{
  "success": true,
  "source": "cache_miss",
  "responseTimeMs": 1500,
  "data": {
    "handle": "tourist",
    "platforms": [],
    "summary": {
      "bestRating": 3486,
      "totalSolved": 3280,
      "activePlatforms": 3
    }
  }
}
```

### Step 13: Frontend displays the result

The frontend updates:

- cache/source badge
- profile summary cards
- platform cards
- leaderboard table
- metrics cards
- loading and success/error messages

## 7. What The Frontend Gives

The frontend gives the user interface.

It contains:

- project title
- API health badge
- search input
- Search button
- Refresh button
- example handle buttons
- profile summary cards
- platform cards
- leaderboard table
- system metrics cards
- short architecture explanation

The frontend does not store permanent data. It only displays what the backend returns.

## 8. What The Backend Gives

The backend gives data through API endpoints.

Current backend endpoints:

```txt
GET /api/health
GET /api/profile/:handle
POST /api/profile/:handle/refresh
GET /api/leaderboard
GET /api/metrics
```

### GET /api/health

Checks if the backend is running.

Output:

```json
{
  "success": true,
  "message": "High Throughput CP API is running"
}
```

### GET /api/profile/:handle

Gets profile data.

Example:

```txt
GET /api/profile/tourist
```

First request usually returns:

```txt
source: "cache_miss"
```

Second request within 300 seconds returns:

```txt
source: "cache_hit"
```

### POST /api/profile/:handle/refresh

Forces fresh data.

Example:

```txt
POST /api/profile/tourist/refresh
```

This ignores current cache and returns:

```txt
source: "fresh_fetch"
```

### GET /api/leaderboard

Reads stored profiles from `profiles.json` and creates a ranking.

Ranking logic:

1. higher bestRating first
2. if tied, higher totalSolved first

### GET /api/metrics

Returns backend counters:

- totalRequests
- cacheHits
- cacheMisses
- freshFetches
- staleCacheUses
- externalApiFailures
- totalResponseTimeMs
- averageResponseTimeMs

## 9. Cache Explanation

Cache means temporary fast storage.

In this project, cache is created using JavaScript `Map`:

```js
const cache = new Map();
```

The cache TTL is:

```txt
300 seconds
```

That means cached data is valid for 5 minutes.

### Why Cache?

Without cache:

- every search calls Codeforces again
- repeated searches are slower
- external API can get stressed

With cache:

- first search fetches real data
- second search returns quickly from memory
- frontend can show `Cache Hit`

## 10. JSON Storage Explanation

This project does not use a database.

Instead, it uses JSON files:

```txt
backend/data/profiles.json
backend/data/metrics.json
```

### profiles.json

Stores searched handles and their profile data.

Used by:

- leaderboard
- stale cache fallback

### metrics.json

Stores request counters and cache counters.

Used by:

- metrics endpoint
- metrics dashboard cards

This is simpler than a database and good for a fast prototype.

## 11. File By File Explanation

## Root Files

### PRD.md

The product requirement document.

It explains:

- project goal
- features
- tech stack
- folder structure
- API endpoints
- final expectations

### AGENTS.md

Rules for building the project.

Important rules include:

- use vanilla frontend
- use Node.js and Express
- do not add React or TypeScript
- keep the prototype simple
- use in-memory cache first
- use JSON file persistence

### README.md

Currently available as the main readme file. It can later explain setup, architecture, and usage.

### explanation.md

This file. It explains the full codebase in beginner-friendly language.

## Frontend Files

### frontend/index.html

This is the structure of the webpage.

It creates:

- header
- title
- API status badge
- search form
- example handle buttons
- profile summary section
- metrics section
- platform card section
- leaderboard table
- architecture explanation section

Important IDs in this file:

```txt
searchForm
handleInput
searchButton
refreshButton
sourceBadge
summaryGrid
platformCards
leaderboardBody
metricsGrid
healthBadge
```

These IDs are used by `app.js` to update the page dynamically.

Output in browser:

- a clean dashboard page
- search box with default value `tourist`
- buttons for `tourist`, `Petr`, and `jiangly`
- empty sections before searching
- populated cards after searching

### frontend/styles.css

This controls the visual design.

It styles:

- page background
- dashboard layout
- cards
- buttons
- input box
- badges
- profile cards
- metric cards
- leaderboard table
- responsive mobile layout

Important class examples:

```txt
panel
button
badge
badge-hit
badge-miss
badge-fresh
badge-stale
summary-grid
platform-grid
metric-grid
```

Output in browser:

- modern dashboard look
- rounded cards
- subtle borders
- readable spacing
- colored badges for cache status and source

### frontend/app.js

This is the frontend logic.

It does the actual API communication using `fetch()`.

Important line:

```js
const API_BASE_URL = "http://localhost:5000/api";
```

This tells the frontend where the backend API is running.

Main functions:

```txt
initializeDashboard()
checkHealth()
searchProfile()
refreshProfile()
loadLeaderboard()
loadMetrics()
renderProfile()
renderLeaderboard()
renderMetrics()
platformCard()
requestJson()
```

What it does:

- checks if backend is online
- calls profile API when Search is clicked
- calls refresh API when Refresh is clicked
- loads leaderboard data
- loads metrics data
- creates HTML cards from API responses
- shows loading messages
- shows errors if backend is offline or request fails

Output in browser:

- clicking Search updates the page with real data
- clicking same handle again shows Cache Hit
- clicking Refresh shows Fresh Fetch
- leaderboard fills with searched handles
- metrics cards update after requests

## Backend Files

### backend/package.json

Defines backend project metadata and scripts.

Important scripts:

```json
{
  "start": "node src/server.js",
  "dev": "node --watch src/server.js"
}
```

This means:

```powershell
npm start
```

starts the Express backend.

Dependency:

```txt
express
```

### backend/package-lock.json

Automatically generated by npm.

It records exact installed dependency versions.

You normally do not edit this manually.

### backend/src/server.js

This is the backend entry point.

It:

- creates the Express app
- decides the port
- enables JSON body parsing
- sets CORS headers for local frontend calls
- tracks response time metrics
- defines `/api/health`
- connects route files
- handles unknown routes
- starts the server

Important line:

```js
app.listen(PORT, () => {
  console.log(`High Throughput CP API running on http://localhost:${PORT}`);
});
```

Output in terminal:

```txt
High Throughput CP API running on http://localhost:5003
```

or another port if `PORT` is set.

### backend/src/routes/profile.routes.js

Defines profile-related routes:

```txt
GET /api/profile/:handle
POST /api/profile/:handle/refresh
```

It does not contain business logic. It only maps URLs to controller functions.

### backend/src/routes/leaderboard.routes.js

Defines leaderboard route:

```txt
GET /api/leaderboard
```

### backend/src/routes/metrics.routes.js

Defines metrics route:

```txt
GET /api/metrics
```

### backend/src/controllers/profile.controller.js

Controller for profile requests.

It:

- receives handle from URL
- calls profile service
- sends success JSON response
- catches errors and sends error JSON response

Output shape:

```json
{
  "success": true,
  "source": "cache_miss",
  "responseTimeMs": 1200,
  "data": {}
}
```

### backend/src/controllers/leaderboard.controller.js

Creates leaderboard response.

It:

- reads stored profiles from JSON
- sorts by bestRating
- then sorts by totalSolved
- returns ranked rows

Output contains:

- rank
- handle
- rating
- maxRating
- solved
- bestRating
- totalSolved
- source
- lastUpdated

### backend/src/controllers/metrics.controller.js

Returns metrics response.

It calls `metricsService.getMetrics()` and returns:

```json
{
  "success": true,
  "data": {
    "totalRequests": 0,
    "cacheHits": 0,
    "cacheMisses": 0,
    "freshFetches": 0,
    "staleCacheUses": 0,
    "externalApiFailures": 0,
    "totalResponseTimeMs": 0,
    "averageResponseTimeMs": 0
  }
}
```

### backend/src/services/profile.service.js

This is the main business logic for profiles.

It handles:

- normal profile search
- refresh profile
- cache hit
- cache miss
- fresh fetch
- stale cache fallback
- calling all adapters
- saving profile data
- building profile summary

Important behavior:

```txt
first search -> cache_miss
second search -> cache_hit
refresh -> fresh_fetch
external failure with old data -> stale_cache
```

### backend/src/services/cache.service.js

Implements in-memory cache using JavaScript `Map`.

It has:

```txt
get()
set()
remove()
```

Cache TTL:

```txt
300 seconds
```

This cache disappears when the backend process stops, because it is stored in memory.

### backend/src/services/storage.service.js

Handles JSON file persistence.

It:

- makes sure `backend/data/` exists
- creates `profiles.json` if missing
- creates `metrics.json` if missing
- reads JSON
- writes JSON
- saves profiles
- saves metrics

### backend/src/services/metrics.service.js

Tracks backend metrics.

It:

- records total requests
- records response time
- increments cache hits
- increments cache misses
- increments fresh fetches
- increments stale cache uses
- increments external API failures
- calculates average response time

### backend/src/adapters/codeforces.adapter.js

This talks to the real Codeforces API.

It calls:

```txt
https://codeforces.com/api/user.info
https://codeforces.com/api/user.status
```

It extracts real profile data and calculates solved problems.

Solved count logic:

- check all submissions
- only use submissions where `verdict === "OK"`
- create a unique problem key
- store keys in a `Set`
- final solved count is `Set.size`

This avoids counting the same accepted problem multiple times.

### backend/src/adapters/leetcode.mock.adapter.js

Returns mock LeetCode data.

It clearly marks:

```js
source: "mock_data"
```

This is not real LeetCode API data. It exists to show that the backend can support multiple platforms later.

### backend/src/adapters/codechef.mock.adapter.js

Returns mock CodeChef data.

It also marks:

```js
source: "mock_data"
```

### backend/src/utils/normalize.js

Contains helper functions.

`normalizeHandle()`:

- trims handle
- lowercases it
- rejects empty handles

`buildProfileSummary()`:

- finds best rating
- adds total solved problems
- counts active platforms

### backend/data/profiles.json

Stores searched profiles.

Example after searching:

```json
{
  "tourist": {
    "handle": "tourist",
    "platforms": [],
    "summary": {},
    "lastUpdated": "2026-06-25T10:00:00.000Z"
  }
}
```

This file powers the leaderboard.

### backend/data/metrics.json

Stores metrics.

Example:

```json
{
  "totalRequests": 4,
  "cacheHits": 1,
  "cacheMisses": 1,
  "freshFetches": 1,
  "staleCacheUses": 0,
  "externalApiFailures": 0,
  "totalResponseTimeMs": 1500
}
```

This file powers the metrics cards.

## 12. How To Run The Project

### Start Backend

Go to backend folder:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\backend
```

Install dependencies:

```powershell
npm install
```

Run backend:

```powershell
npm start
```

If you want backend on port `5000`:

```powershell
$env:PORT=5000
npm start
```

### Open Frontend

Open `frontend/index.html` using VS Code Live Server.

Or run a simple static server:

```powershell
cd C:\Users\varap\OneDrive\Desktop\high_throughput_cp_page\high_throughput_cp_page\high_throughput_cp_page\frontend
python -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

## 13. How To Test The Main Features

### Test API Health

Open:

```txt
http://localhost:5000/api/health
```

or use the backend port you are actually running.

Expected:

```json
{
  "success": true,
  "message": "High Throughput CP API is running"
}
```

### Test Search

In the frontend, search:

```txt
tourist
```

Expected:

- profile summary appears
- platform cards appear
- source badge shows `Cache Miss`
- leaderboard updates
- metrics update

### Test Cache Hit

Search the same handle again within 300 seconds.

Expected:

- source badge shows `Cache Hit`
- data appears quickly
- cache hit metric increases

### Test Refresh

Click `Refresh`.

Expected:

- frontend calls `POST /api/profile/:handle/refresh`
- backend ignores cache
- source badge shows `Fresh Fetch`

### Test Leaderboard

Search a few handles:

```txt
tourist
Petr
jiangly
```

Click `Load Leaderboard`.

Expected:

- table shows searched profiles
- higher bestRating ranks first
- if ratings tie, higher totalSolved ranks first

### Test Metrics

Click `Load Metrics`.

Expected metrics:

- total requests
- cache hits
- cache misses
- fresh fetches
- stale cache uses
- external API failures
- average response time

## 14. Important Interview Explanation

You can explain this project like this:

This is a JavaScript full-stack prototype that fetches competitive programming profile data. The frontend is built with vanilla HTML, CSS, and JavaScript. The backend is built with Node.js and Express. When the user searches a handle, the frontend calls the backend API. The backend first checks an in-memory cache. If data exists, it returns a cache hit. If not, it fetches fresh Codeforces data, combines it with mock LeetCode and CodeChef adapters, stores the result in JSON, updates metrics, and returns the profile. The leaderboard is generated from stored profiles, and the metrics endpoint shows cache and response-time behavior.

## 15. Simple Mental Model

Think of the project like this:

```txt
index.html = page skeleton
styles.css = dashboard design
app.js = browser logic and API calls
server.js = starts backend and connects routes
routes = URL mapping
controllers = request and response handling
services = main logic
adapters = platform data fetchers
cache.service.js = temporary fast memory
storage.service.js = JSON file database substitute
metrics.service.js = counters and timings
profiles.json = saved profile data
metrics.json = saved metrics data
```

If you understand this flow, you understand the whole project.
