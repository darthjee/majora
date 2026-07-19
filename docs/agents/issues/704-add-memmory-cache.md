# Issue: Add memory cache

## Description
Add a backend module dedicated to in-memory caching, since Redis is not available in this environment. As a first consumer, existing permission checks (admin/staff, Game DM/player, PC DM/owner, NPC DM) will read from this cache instead of hitting the database on every request. A companion staff-only page and endpoint let staff manually clear the cache.

## Problem
Every permission check currently hits the database on every call, with no caching layer anywhere in `backend/`:

- `Game.has_player` (`backend/games/models/game/game.py`) runs `self.players.filter(user=user, is_dm=...).exists()`.
- `Character.can_be_edited_by` (`backend/games/models/character/character.py`) runs `self.editors.filter(id=user.id).exists()`.
- `require_staff` (`backend/games/views/common.py`) re-checks `request.user.is_staff`/`is_superuser` on every call.

These checks (wrapped by the `_EditPermission` subclasses in `backend/games/permissions.py`) run on nearly every authenticated request, so the same user/entity pair is frequently re-queried. There is no Redis instance available in this environment to offload this to an external cache.

## Expected Behavior
- A reusable, in-process (in-memory) cache module exists, independent of any single Django app.
- Each cached entry tracks: storage date, last-read date, the stored data itself, a lookup key, a type, and its size in bytes.
- A general/base cache class provides the shared storage, size-limit, and eviction logic; one subclass exists per data type stored in it.
- Lookups first partition by type, then by key within that type (a nested structure, not one flat dictionary).
- Every write (create, update, or an entry being evicted/cleared) updates the entry's usage bookkeeping (read date).
- The total cache size limit (in bytes) is a settings constant: env var `MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES`, default `10485760` (10 MB).
- When the total cache size reaches that limit, each subsequent save first evicts the least-recently-read entries (batch size from a settings constant: env var `MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE`, default `10`) before writing.
- If the cache reaches double its size limit, the entire cache is cleared outright.
- No time-based expiration is implemented (acceptable since the server restarts often enough in practice), and no proactive invalidation on permission-affecting mutations (e.g. removing a player, transferring PC ownership, toggling DM status) — stale entries are cleared out only by the eviction/double-limit/manual-clear paths above.
- The four existing permission checks — admin/staff, Game (DM or player), PC (DM or owner), NPC (DM) — read from and populate this cache instead of always hitting the database. Cache keys include the requesting user's id.
- A new `/#/staff/dashboard` frontend page, reachable only by admin/staff, shows a single card with one button (tooltip "Clear Cache", icon `database-fill-dash`) that clears the entire cache.
- A new staff-only `DELETE` endpoint clears the entire cache.

## Solution
- New cache module, placed independently of the `games` app so it can be reused for data beyond permissions (exact placement decided during planning).
- Extend `backend/games/permissions.py` (`_EditPermission`, `_is_admin_or_player`) and the model-level checks (`Game.has_player`, `Character.can_be_edited_by`, `require_staff` in `backend/games/views/common.py`) to consult the cache before/after their existing DB queries.
- Size-limit and eviction-batch-size constants belong in a `Settings` class following the existing per-app convention (e.g. `backend/games/settings.py`'s `env_int(...)` pattern): `env_int('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES', 10485760)` and `env_int('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', 10)`.
- New `DELETE staff/cache.json` endpoint, following this project's existing `staff/*` naming/URL convention (`backend/games/urls/staff.py`, `backend/games/views/staff/`), guarded by `require_staff` like the other staff endpoints.
- New frontend page following the existing `staff_user` pages pattern (`frontend/assets/js/components/resources/staff_user/pages/`: page + `controllers/` + `helpers/`), registered in `AppHelper.jsx` and gated via `accessRouteConfig.js`'s `staffOrSuperuser` kind.
- Add a `database-fill-dash` entry to `frontend/assets/js/utils/ui/Icons.js`; reuse `CardHoverTooltip.jsx` for the card/tooltip/button.

## Benefits
- Cuts repeated database queries for permission checks, which run on nearly every authenticated request.
- Establishes a general-purpose in-memory caching module the project can reuse for other data, without depending on an external cache service (Redis) that isn't available in this environment.
- Gives staff a manual way to clear stale cached data without restarting the server.
