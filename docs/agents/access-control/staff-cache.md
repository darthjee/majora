# Staff Cache (memory cache management)

**[Staff resource](principles.md#resource-categories).** Two staff-only endpoints manage the
process-wide in-memory cache, plus a read-only summary. Both enforce **Staff-or-superuser**
inline, matching every other `staff/*` endpoint. Both responses set `X-Skip-Cache: true` per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule).

| Action | Who can |
|--------|---------|
| Clear the entire memory cache (`DELETE /staff/cache.json`) | **Staff-or-superuser** |
| Read the current cache size/limit (`GET /staff/cache/summary.json`) | **Staff-or-superuser** |

**Behavior**: `DELETE /staff/cache.json` wipes every cached entry across every type (admin-or-staff,
Game DM/player, PC editor, NPC editor — see [Common Rules](common-rules.md) for how those checks
are cached). Returns `204 No Content` on success.

`GET /staff/cache/summary.json` is read-only and returns `{"size": <int bytes>, "limit": <int
bytes>}`.

This is a manual complement to the cache module's own automatic eviction (LRU batch eviction at
`MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES`, full clear at double that size) — there is no proactive
invalidation on permission-affecting mutations (removing a player, transferring PC ownership,
toggling DM status), so stale entries are only ever cleared by eviction, the double-limit
auto-clear, or this endpoint.
