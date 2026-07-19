# Staff Cache (memory cache management)

A single staff-only endpoint clears the process-wide in-memory cache
(`backend/majora_project/cache/`) introduced by issue #704. It requires
`CookieTokenAuthentication` and enforces **Staff-or-superuser** inline via `require_staff`
(`backend/games/views/common.py`), matching every other `staff/*` endpoint. The response sets
`X-Skip-Cache: true`.

| Action | Who can |
|--------|---------|
| Clear the entire memory cache (`DELETE /staff/cache.json`) | **Staff-or-superuser** |

**Behavior**: calls `memory_cache.clear()` (the shared `MemoryCache` singleton exported by
`majora_project.cache`), wiping every cached entry across every type (admin-or-staff, Game
DM/player, PC editor, NPC editor — see [Common Rules](common-rules.md) for how those checks are
now cached). Returns `204 No Content` on success; `401`/`403` follow the same shape as every
other `require_staff`-guarded endpoint.

This is a manual complement to the cache module's own automatic eviction (LRU batch eviction at
`MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES`, full clear at double that size) — there is no proactive
invalidation on permission-affecting mutations (removing a player, transferring PC ownership,
toggling DM status), so stale entries are only ever cleared by eviction, the double-limit
auto-clear, or this endpoint.
