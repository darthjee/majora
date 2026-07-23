# Staff Cache (memory cache management)

Two staff-only endpoints manage the process-wide in-memory cache
(`backend/majora_project/cache/`) introduced by issue #704, plus the read-only summary added by
issue #780. Both require `CookieTokenAuthentication` and enforce **Staff-or-superuser** inline via
`require_staff` (`backend/games/views/common.py`), matching every other `staff/*` endpoint. Both
responses set `X-Skip-Cache: true`.

| Action | Who can |
|--------|---------|
| Clear the entire memory cache (`DELETE /staff/cache.json`) | **Staff-or-superuser** |
| Read the current cache size/limit (`GET /staff/cache/summary.json`) | **Staff-or-superuser** |

**Behavior**: `DELETE /staff/cache.json` calls `memory_cache.clear()` (the shared `MemoryCache`
singleton exported by `majora_project.cache`), wiping every cached entry across every type
(admin-or-staff, Game DM/player, PC editor, NPC editor — see [Common Rules](common-rules.md) for
how those checks are now cached). Returns `204 No Content` on success; `401`/`403` follow the same
shape as every other `require_staff`-guarded endpoint.

`GET /staff/cache/summary.json` is read-only — it does not mutate the cache — and returns
`{"size": <int bytes>, "limit": <int bytes>}` via `memory_cache.summary()`, reporting the running
`_total_size_bytes` and the configured `Settings.max_size_bytes()`.

This is a manual complement to the cache module's own automatic eviction (LRU batch eviction at
`MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES`, full clear at double that size) — there is no proactive
invalidation on permission-affecting mutations (removing a player, transferring PC ownership,
toggling DM status), so stale entries are only ever cleared by eviction, the double-limit
auto-clear, or this endpoint.
