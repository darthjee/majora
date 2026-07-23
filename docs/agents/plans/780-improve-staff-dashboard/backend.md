# Backend Plan: Improve staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

- New `GET /staff/cache/summary.json` endpoint: `CookieTokenAuthentication`,
  `AllowAny` + inline `require_staff` (401/403), `X-Skip-Cache: true` response
  header, body `{ "size": <int bytes>, "limit": <int bytes> }` — same shape and
  gating pattern as the existing `DELETE /staff/cache.json`.

## Implementation Steps

### Step 1 — Add `MemoryCache.summary()`

Edit `backend/majora_project/cache/base.py`: add a `summary()` method returning
`{'size': self._total_size_bytes, 'limit': Settings.max_size_bytes()}`. `Settings`
is already imported in this file (used by `_evict_if_needed`). This keeps the new
view thin — it just serializes the dict — instead of reaching into
`MemoryCache`'s name-mangled/private `_total_size_bytes` attribute directly.

### Step 2 — Add the new view

Add `backend/games/views/staff/staff_cache_summary.py`, mirroring
`staff_cache_clear.py`'s auth/permission decorators and `require_staff` check:

```python
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def staff_cache_summary(request):
    """Return the current memory cache size and limit, in bytes."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    response = Response(memory_cache.summary())
    response['X-Skip-Cache'] = 'true'
    return response
```

Register it in `backend/games/views/staff/__init__.py` (`__all__` list, alongside
`staff_cache_clear`) and in `backend/games/urls/staff.py`:

```python
path('staff/cache/summary.json', views.staff_cache_summary, name='staff-cache-summary'),
```

Place it next to the existing `staff/cache.json` entry.

### Step 3 — Tests

- `backend/games/tests/cache/base_test.py`: add tests for `MemoryCache.summary()`
  — returns the running `_total_size_bytes` as `size` and `Settings.max_size_bytes()`
  as `limit`, on an empty cache and after `set()`-ing entries (mirroring the
  existing `setup_method`/monkeypatch style already used in this file for
  `Settings.max_size_bytes`).
- `backend/games/tests/views/staff/staff_cache_summary_test.py`, mirroring
  `staff_cache_clear_test.py`'s structure (`setup_method` priming staff/superuser/
  regular users + tokens and a cache entry):
  - 401 unauthenticated.
  - 403 for a regular authenticated user.
  - 200 for a staff user and for a superuser, asserting the JSON body is
    `{"size": <expected>, "limit": <expected>}` matching the primed cache entry's
    size and `Settings.max_size_bytes()`.
  - `X-Skip-Cache: true` response header.
  - The endpoint does not mutate the cache (unlike the DELETE endpoint) — assert
    the primed entry is still present after the GET.

### Step 4 — Update the access-control doc

`docs/agents/access-control/staff-cache.md` currently only documents the clear
endpoint. Add a row for the new endpoint to its table:

| Action | Who can |
|--------|---------|
| Read the current cache size/limit (`GET /staff/cache/summary.json`) | **Staff-or-superuser** |

and a short "Behavior" note that it's read-only (no mutation, unlike the clear
endpoint) and follows the same `require_staff` gate. Also reword the file's
one-line description in `docs/agents/access-control.md`'s index (currently
"the staff-only memory-cache-clear endpoint") to cover both endpoints, e.g. "the
staff-only memory-cache management endpoints".

## Files to Change

- `backend/majora_project/cache/base.py` — add `summary()`
- `backend/games/tests/cache/base_test.py` — test `summary()`
- `backend/games/views/staff/staff_cache_summary.py` — new view
- `backend/games/views/staff/__init__.py` — export `staff_cache_summary`
- `backend/games/urls/staff.py` — register the new route
- `backend/games/tests/views/staff/staff_cache_summary_test.py` — new
- `docs/agents/access-control/staff-cache.md` — document the new endpoint
- `docs/agents/access-control.md` — update the one-line index description

## CI Checks

- `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`)
- `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`, covers `games/tests/cache/`)
- `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- No migration is needed — nothing here touches a model.
- No serializer is needed — the response body is a plain two-key dict, matching
  the DELETE endpoint's precedent of not using a serializer for a
  non-resource-shaped body.
