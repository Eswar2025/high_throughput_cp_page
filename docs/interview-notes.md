# Interview Notes

Initial placeholder for caching, TTL, stale fallback, and trade-off notes.

## Phase 1 Reliability Improvements

- Input validation trims profile handles, rejects empty values, and only allows letters, numbers, underscore, hyphen, and dot. Invalid handles return a clean `400` JSON error before reaching Codeforces.
- A simple in-memory IP rate limiter protects the API at 30 requests per minute per IP. Extra requests return `429` and increment `rateLimitedRequests`.
- Stale cache fallback returns the last stored profile from `profiles.json` when an external platform fetch fails and old data exists. This returns `source: "stale_cache"` and increments both `externalApiFailures` and `staleCacheUses`.
- API responses now have a consistent shape: success responses include `success`, `responseTimeMs`, and `data`; profile responses also include `source`. Error responses include `success`, `responseTimeMs`, and an `error` object with `code` and `message`.
