# PRD.md

# High Throughput CP Page

## 1. Project Name

**High Throughput CP Page**

Resume-friendly name:

**High-Throughput Competitive Programming Metrics Aggregator**

Short name:

**CP Metrics API**

## 2. Project Goal

Build a simple but strong full-stack prototype that fetches and displays competitive programming profile metrics.

The project should look simple on the frontend but should demonstrate strong backend concepts useful for FAANG-style interviews:

* API design
* Redis/in-memory caching
* TTL-based cache expiry
* external API rate-limit protection
* concurrent data fetching
* stale-cache fallback
* response-time tracking
* leaderboard generation
* clean system-design explanation

The goal is not to build a huge production app. The goal is to build a working, explainable, resume-ready prototype within 2–3 days.

## 3. User Context

This project is being built by a CSE student for internship resume preparation.

The student currently knows:

* HTML
* CSS
* JavaScript

So the frontend should remain simple and should not use heavy frameworks.

The backend can use Node.js and Express because it is still JavaScript-based and easier to explain.

## 4. Problem Statement

During internships, coding-club shortlisting, hackathons, or student ranking, organizers may need to check the competitive programming profiles of many students.

Directly calling external coding platform APIs repeatedly can cause:

* slow responses
* failed external requests
* API call limits
* repeated duplicate network calls
* poor dashboard reliability

This project solves the problem by building a backend API that:

1. accepts a coding handle,
2. fetches public competitive programming data,
3. caches the result,
4. serves repeated requests quickly,
5. falls back to old data when external APIs fail,
6. displays profile metrics and leaderboard data on a clean webpage.

## 5. Final Scope

This project will mainly support:

* Codeforces real API
* LeetCode mock/manual data
* CodeChef mock/manual data

Only Codeforces needs to be truly working from an external API.

LeetCode and CodeChef can be shown as mock adapters to demonstrate extensible architecture.

## 6. Non-Goals

The project will not include:

* React
* Next.js
* authentication
* login/signup
* database-heavy architecture
* complex admin panel
* WebSockets
* payment system
* real-time updates
* illegal scraping
* bypassing platform limits
* advanced deployment pipelines

## 7. Tech Stack

## Frontend

Use:

* HTML
* CSS
* JavaScript
* Tailwind CSS CDN
* shadcn-inspired card/button/table styling

Do not use React for the first version.

## Backend

Use:

* Node.js
* Express.js
* JavaScript
* Redis if available
* in-memory cache fallback if Redis is not running
* JSON file storage for simple persistence

## Testing / Benchmarking

Use:

* Postman or Thunder Client
* autocannon for basic load testing

## 8. Repository Name

```txt
high_throughput_cp_page
```

## 9. Recommended Folder Structure

```txt
high_throughput_cp_page/
  backend/
    src/
      server.js
      routes/
        profile.routes.js
        leaderboard.routes.js
        metrics.routes.js
      controllers/
        profile.controller.js
        leaderboard.controller.js
        metrics.controller.js
      services/
        profile.service.js
        cache.service.js
        metrics.service.js
        storage.service.js
      adapters/
        codeforces.adapter.js
        leetcode.mock.adapter.js
        codechef.mock.adapter.js
      middleware/
        rateLimiter.js
        responseTimer.js
      utils/
        normalize.js
        logger.js
    data/
      profiles.json
      metrics.json
    package.json
    .env.example

  frontend/
    index.html
    styles.css
    app.js

  docs/
    interview-notes.md
    architecture.md
    load-test-results.md

  PRD.md
  README.md
  AGENTS.md
  .gitignore
```

## 10. Core Features

## 10.1 Home Page

The home page should allow the user to search for a competitive programming handle.

Example handles:

```txt
tourist
Petr
jiangly
```

Frontend should include:

* project title
* short subtitle
* search input
* search button
* cache/system explanation cards
* profile result area
* leaderboard table
* system metrics cards

All can be on a single page for the prototype.

## 10.2 Profile Search

When the user enters a handle and clicks search:

Frontend calls:

```txt
GET /api/profile/:handle
```

Example:

```txt
GET /api/profile/tourist
```

Backend should:

1. check cache,
2. return cached data if available,
3. otherwise fetch fresh data,
4. normalize the data,
5. store the result,
6. return it to frontend.

## 10.3 Cache System

Backend should support two cache modes:

1. Redis cache if Redis is connected.
2. In-memory JavaScript Map fallback if Redis is not available.

Cache TTL:

```txt
300 seconds
```

Return source status:

```txt
cache_hit
cache_miss
fresh_fetch
stale_cache
```

Frontend should show this source using a badge.

## 10.4 Codeforces Real Adapter

Backend should fetch real Codeforces data.

Use these Codeforces API endpoints:

```txt
/user.info
/user.status
```

Data to extract:

* handle
* rating
* maxRating
* rank
* maxRank
* contribution
* friendOfCount
* solved problem count

Solved problem count can be calculated from accepted submissions.

Only count unique accepted problems.

## 10.5 Mock Adapters

Create mock adapters for:

* LeetCode
* CodeChef

These should return sample data with clear source:

```txt
mock_data
```

This shows adapter-based design without spending time on unstable APIs.

## 10.6 Concurrent Fetching

When fetching multiple platform adapters, use:

```js
Promise.allSettled()
```

Reason:

If one platform fails, the whole profile API should not fail.

## 10.7 Stale Cache Fallback

If fresh fetch fails but old cached/stored data exists, backend should return stale data.

Response source:

```txt
stale_cache
```

Frontend should show warning:

```txt
External API failed. Showing last available data.
```

## 10.8 Rate Limiter

Backend should include simple rate limiting.

Example:

```txt
Maximum 10 requests per minute per IP
```

This protects the backend from too many repeated calls.

## 10.9 Leaderboard

Create endpoint:

```txt
GET /api/leaderboard
```

Leaderboard is generated from stored profile data.

Ranking logic:

1. higher Codeforces rating
2. higher solved count
3. latest updated profile

Leaderboard columns:

```txt
Rank
Handle
Rating
Max Rating
Solved
Source
Last Updated
```

## 10.10 Metrics Endpoint

Create endpoint:

```txt
GET /api/metrics
```

Return:

```json
{
  "totalRequests": 0,
  "cacheHits": 0,
  "cacheMisses": 0,
  "freshFetches": 0,
  "staleCacheUses": 0,
  "externalApiFailures": 0,
  "averageResponseTimeMs": 0
}
```

Frontend should display these as small cards.

## 11. API Endpoints

## 11.1 Health Check

```txt
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "High Throughput CP API is running"
}
```

## 11.2 Get Profile

```txt
GET /api/profile/:handle
```

Response:

```json
{
  "success": true,
  "source": "cache_hit",
  "responseTimeMs": 12,
  "data": {
    "handle": "tourist",
    "platforms": [
      {
        "platform": "codeforces",
        "handle": "tourist",
        "rating": 3850,
        "maxRating": 3979,
        "rank": "legendary grandmaster",
        "maxRank": "legendary grandmaster",
        "solvedCount": 1200,
        "source": "real_api",
        "lastUpdated": "2026-06-25T10:00:00.000Z"
      }
    ],
    "summary": {
      "bestRating": 3850,
      "totalSolved": 1200,
      "activePlatforms": 3
    }
  }
}
```

## 11.3 Refresh Profile

```txt
POST /api/profile/:handle/refresh
```

This ignores the current cache and fetches fresh data.

## 11.4 Leaderboard

```txt
GET /api/leaderboard
```

## 11.5 Metrics

```txt
GET /api/metrics
```

## 12. Frontend UI Requirements

Since the frontend should be simple, use one main page.

## 12.1 Page Sections

The frontend should contain:

1. Navbar
2. Hero section
3. Search section
4. Profile result section
5. Leaderboard section
6. System metrics section
7. Architecture explanation section

## 12.2 UI Style

Use Tailwind CDN.

Design should look like a modern dashboard:

* white or dark background
* rounded cards
* subtle borders
* professional spacing
* badges for cache status
* simple tables
* no heavy animations

## 12.3 Buttons

Buttons required:

```txt
Search
Refresh
Load Leaderboard
Load Metrics
Clear
```

## 12.4 Badges

Badges required:

```txt
Cache Hit
Cache Miss
Fresh Fetch
Stale Cache
Real API
Mock Data
```

## 13. Backend Logic Flow

## 13.1 Normal Request Flow

```txt
User searches handle
↓
Frontend calls GET /api/profile/:handle
↓
Backend checks cache
↓
If cache hit, return immediately
↓
If cache miss, fetch Codeforces + mock adapters
↓
Normalize response
↓
Save to storage
↓
Save to cache
↓
Return profile
```

## 13.2 Failure Flow

```txt
External API fails
↓
Backend checks stored old profile
↓
If old profile exists, return stale data
↓
If no old profile exists, return clean error
```

## 14. Storage Design

Use JSON files for fast prototype.

## profiles.json

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

## metrics.json

```json
{
  "totalRequests": 0,
  "cacheHits": 0,
  "cacheMisses": 0,
  "freshFetches": 0,
  "staleCacheUses": 0,
  "externalApiFailures": 0,
  "totalResponseTimeMs": 0
}
```

## 15. Performance Targets

For local demo:

```txt
Cached response: under 50ms
Fresh Codeforces response: under 3 seconds
Leaderboard response: under 200ms
```

Only mention measured numbers after running tests.

## 16. Load Testing

Use autocannon.

Command:

```bash
npx autocannon -c 20 -d 10 http://localhost:5000/api/profile/tourist
```

Record:

* average latency
* requests per second
* errors
* cache hit behavior

## 17. Minimum Prototype for Tomorrow Morning

The prototype is acceptable if it has:

* working Express backend
* working frontend page
* search Codeforces handle
* display profile data
* cache hit/cache miss badge
* leaderboard from searched profiles
* metrics cards
* README with explanation

Redis can be optional for the first prototype if in-memory cache fallback works.

## 18. Complete Version for 2–3 Days

The final version should add:

* Redis through Docker
* refresh endpoint
* stale-cache fallback
* rate limiter
* better frontend polish
* load test results
* architecture diagram
* interview notes
* proper README
* clean Git commits

## 19. Interview Talking Points

## Why caching?

Repeated external API calls are slow and may hit limits. Caching allows repeated profile requests to be served quickly from memory.

## Why TTL?

Competitive programming data does not need to be updated every second. A 5-minute TTL balances freshness and performance.

## Why stale cache?

If the external API fails, showing old data is better than showing nothing.

## Why Promise.allSettled?

One failed platform should not break the full response.

## Why adapter pattern?

Different platforms have different API formats. Adapters convert each platform response into one common format.

## Why JSON file instead of database?

For this prototype, JSON storage is enough to show persistence. The architecture can later be upgraded to PostgreSQL or MongoDB without changing frontend behavior.

## 20. Resume Bullets

Use after completion:

```txt
- Built a high-throughput competitive programming metrics aggregator using JavaScript, Express.js, Redis caching, and a vanilla HTML/CSS/JS dashboard.
- Implemented TTL-based caching, stale-cache fallback, and rate-limit protection to reduce repeated external API calls and improve reliability.
- Designed a platform-adapter architecture to normalize Codeforces API data and mock LeetCode/CodeChef metrics into a common profile format.
- Used concurrent data fetching with Promise.allSettled so partial platform failures do not break the complete profile response.
- Added leaderboard generation, system metrics, cache-status visibility, and load testing to demonstrate backend performance trade-offs.
```

## 21. Final One-Line Explanation

High Throughput CP Page is a JavaScript-based backend-heavy project that aggregates competitive programming profile metrics using caching, fallback, concurrency, and rate-limit protection to provide fast and reliable profile dashboards.
