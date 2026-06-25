# AGENTS.md

# Coding Agent Rules for high_throughput_cp_page

## Main Rule

Build a working prototype first. Do not over-engineer.

The user knows HTML, CSS, and JavaScript. Avoid React, TypeScript, Next.js, Prisma, and complex frameworks unless explicitly requested later.

Use:

* vanilla frontend
* Node.js
* Express.js
* JavaScript
* Redis optional
* in-memory cache fallback required
* JSON file persistence

## Project Priority

Priority order:

1. Working backend
2. Working frontend
3. Cache hit/miss demo
4. Codeforces real API
5. Leaderboard
6. Metrics dashboard
7. Documentation
8. Load testing

## Do Not Add

Do not add:

* authentication
* React
* TypeScript
* database setup
* Docker-heavy full stack
* complex folder nesting
* advanced UI libraries
* unnecessary dependencies

## Backend Requirements

Create backend in:

```txt
backend/
```

Use Express.

Required endpoints:

```txt
GET /api/health
GET /api/profile/:handle
POST /api/profile/:handle/refresh
GET /api/leaderboard
GET /api/metrics
```

Implement:

* Codeforces adapter
* LeetCode mock adapter
* CodeChef mock adapter
* cache service
* storage service
* metrics service
* rate limiter
* response timer

## Frontend Requirements

Create frontend in:

```txt
frontend/
```

Use:

```txt
index.html
styles.css
app.js
```

Use Tailwind CDN and shadcn-inspired styling.

Frontend must show:

* search input
* profile cards
* cache status badge
* refresh button
* leaderboard table
* system metrics cards
* simple architecture explanation

## Cache Requirements

Use in-memory cache first.

Then add Redis support if possible.

If Redis fails, app must still work using in-memory cache.

Cache source values:

```txt
cache_hit
cache_miss
fresh_fetch
stale_cache
```

## Code Quality Rules

* Keep code readable.
* Add comments only where logic is important.
* Avoid fake data in Codeforces adapter.
* Mock adapters must clearly say mock_data.
* Do not fake benchmark numbers.
* Do not make unsupported claims in README.
* Every feature must be runnable locally.

## Final Output Required

The repository must include:

```txt
PRD.md
README.md
AGENTS.md
backend/
frontend/
docs/interview-notes.md
docs/architecture.md
docs/load-test-results.md
```

## Definition of Done

The project is complete when:

1. `npm install` works in backend.
2. `npm start` starts backend.
3. Frontend opens in browser.
4. Searching `tourist` shows profile data.
5. Re-searching `tourist` shows cache hit.
6. Leaderboard updates after searches.
7. Metrics page/cards show cache hits and misses.
8. README explains setup and architecture.
9. Interview notes explain caching, TTL, fallback, and trade-offs.
