# Backend Plan: Add memory cache

Main plan: [plan.md](plan.md)

## Shared contracts

- Must expose `DELETE /staff/cache.json`, staff-or-superuser only, `X-Skip-Cache: true`,
  `200`/`204` on success — this is what the frontend calls.
- Must define `MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES` (default `10485760`) and
  `MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE` (default `10`) as env-backed settings.

## Implementation Steps

### Step 1 — Cache module (`backend/majora_project/cache/`)

Place it under `majora_project/` (not `games/`) since it's app-agnostic shared infrastructure,
matching the existing convention of `majora_project/env.py` (shared `env_int` helper). No Django
models, no migrations — pure in-process Python state.

- `entry.py` — `CacheEntry`: holds `key`, `type`, `data`, `size_bytes`, `stored_at`, `read_at`
  (use `django.utils.timezone.now()` for both timestamps).
- `settings.py` — `Settings.max_size_bytes()` (`env_int('MAJORA_MEMORY_CACHE_MAX_SIZE_BYTES',
  10485760)`) and `Settings.eviction_batch_size()`
  (`env_int('MAJORA_MEMORY_CACHE_EVICTION_BATCH_SIZE', 10)`), reusing
  `majora_project.env.env_int`.
- `base.py` — `MemoryCache`: the "general class for all the cache" referenced in the issue.
  Holds a nested structure `{type: {key: CacheEntry}}` plus a running total size in bytes.
  - `get(type, key)` — returns the stored data or `None`; on hit, updates `read_at`.
  - `set(type, key, data, size_bytes)` — evicts first if at/over the size limit (see below),
    then stores/overwrites the entry (updates `stored_at`/`read_at` and the running total).
  - `clear()` — empties the whole store (used both by the double-limit auto-clear and the new
    staff endpoint).
  - Eviction (private, called from `set`): if the total size is at/over
    `Settings.max_size_bytes()`, remove the `Settings.eviction_batch_size()` entries with the
    oldest `read_at` across the *whole* cache (LRU, not scoped to a single type) before writing
    the new entry. If the total is at/over double `Settings.max_size_bytes()`, call `clear()`
    instead of batch-evicting.
  - This class should be usable as a module-level singleton (e.g. a single shared instance
    imported by callers), since its whole purpose is one process-wide cache.
- Per-type subclasses/wrappers, one per cache consumer (see Step 2), each fixing its own `type`
  string and building keys that embed the requesting user's id (per the issue: "the user_id
  needs to be part of the keys").

### Step 2 — Wire the four permission checks into the cache

Cache these four boolean checks (the "First use" list from the issue), each as its own type:

- **Admin-or-staff** (general): wraps `request.user.is_staff or request.user.is_superuser`,
  used today by `require_staff` (`backend/games/views/common.py`) and
  `_EditPermission._is_admin_or_player` (`backend/games/permissions.py`). Key: user id alone.
- **Game** (DM or player): wraps `Game.has_player(user)` (`backend/games/models/game/game.py`).
  Key: user id + game id.
- **PC** (DM or owner) and **NPC** (DM): both currently computed by `Character.is_editor(user)`
  (`backend/games/models/character/character.py`, via the `editors` queryset union of the
  game's DMs plus — for PCs only — the owning player). Keep them as two distinct cache types
  (per the issue's explicit PC/NPC split) even though they share the same underlying query;
  branch on `character.is_pc`. Key: user id + character id.

Add the cache read/write around the existing DB lookups at the narrowest point that covers all
callers (e.g. inside `has_player`/`is_editor`/the staff check itself) rather than duplicating
the check at every call site.

### Step 3 — New staff endpoint

Follow the existing `staff/*` pattern exactly (see `staff_user_detail.py` for the template):

- `backend/games/views/staff/staff_cache_clear.py` — `@api_view(['DELETE'])`,
  `CookieTokenAuthentication`, `AllowAny` + inline `require_staff(request)` guard, calls the
  cache's `clear()`, returns a `Response` with `X-Skip-Cache: true`.
- Export it from `backend/games/views/staff/__init__.py` and `backend/games/views/__init__.py`
  (mirror the existing `staff_user_detail` export lines).
- Register `path('staff/cache.json', views.staff_cache_clear, name='staff-cache-clear')` in
  `backend/games/urls/staff.py`.

### Step 4 — Access-control docs

Add the new endpoint to `docs/agents/access-control.md`'s doc set (either a new
`access-control/staff-cache.md` or a section in `access-control/user.md`), per this repo's
"update access-control docs alongside any new endpoint" convention — Staff-or-superuser only.

### Step 5 — Tests

Mirror the existing test-tree layout under `backend/games/tests/`:

- Unit tests for `MemoryCache` (miss/hit, LRU eviction at the size limit, full clear at double
  the limit, `read_at` bookkeeping on both read and write).
- Tests for each of the four permission-cache wrappers (cache populated on miss, served from
  cache on hit, correct key includes user id).
- View test for the new `staff/cache.json` endpoint: staff/superuser succeeds and clears the
  cache; anonymous gets 401; authenticated non-staff gets 403.

## Files to Change

- `backend/majora_project/cache/entry.py` — new: `CacheEntry`.
- `backend/majora_project/cache/base.py` — new: `MemoryCache` general/base class + eviction logic.
- `backend/majora_project/cache/settings.py` — new: size-limit/eviction-batch settings.
- `backend/games/permissions.py`, `backend/games/models/game/game.py`,
  `backend/games/models/character/character.py`, `backend/games/views/common.py` — wire in the
  four cached permission checks.
- `backend/games/views/staff/staff_cache_clear.py` — new: the `DELETE staff/cache.json` view.
- `backend/games/views/staff/__init__.py`, `backend/games/views/__init__.py` — export the new view.
- `backend/games/urls/staff.py` — register the new route.
- `docs/agents/access-control.md` (+ a new/updated resource file) — document the new endpoint.
- `backend/games/tests/...` — new tests mirroring the files above (cache module, permission
  wiring, and the new staff view).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all` /
  `pytest_views_rest`, depending on which test paths are touched)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- The issue leaves the exact home of the cache module implicit beyond "independent of any
  single Django app" — `majora_project/` was chosen here as the closest existing precedent
  (shared, app-agnostic utilities); adjust if a better fit emerges during implementation.
- No proactive cache invalidation on permission-affecting mutations (player removal, ownership
  transfer, DM toggling) — confirmed out of scope during issue discussion; staleness is bounded
  only by eviction, the double-limit auto-clear, and the manual staff "Clear Cache" action.
- Per-entry `size_bytes` is expected to be supplied by the caller at write time (e.g. via
  `sys.getsizeof` or a serialized-length estimate) rather than computed inside the cache module
  itself — pick whichever is simplest for the boolean permission values being cached first.
