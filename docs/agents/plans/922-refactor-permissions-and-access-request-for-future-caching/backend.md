# Backend Plan: Refactor permissions and access request for future caching

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the API changes described in the main plan:
- `access.json` gains `is_logged: boolean` (never `null`) for all three access serializers (`Game`, `Character`, `Treasure`), via the shared `BaseAccessSerializer`.
- `permissions.json`'s `?role=` parser recognizes a new `logged` value, and no longer returns `None`/falls back to a real-identity lookup when no `role` param is present at all — it always returns a full booleans dict (every key, including `is_logged`, defaulting to `False` when absent).

Does **not** touch `Roles`'s `_resolve_*` methods or its `Roles(user=..., game=..., pc=...)` constructor (`backend/games/permissions/roles.py`) — that real DB/session lookup is shared with `EndpointPermission` (`backend/games/permissions/base.py`), used for real authorization enforcement elsewhere, out of scope here.

## Implementation Steps

### Step 1 — Add `is_logged` to `BaseAccessSerializer`

In `games/serializers/base_access.py`, add `'is_logged': self._is_authenticated()` to `to_representation()`'s returned dict. Unlike `is_superuser`/`is_staff`/`is_dm` (`None` when unauthenticated), `is_logged` is always a plain boolean — it's the authentication signal itself, needed by anonymous callers too.

### Step 2 — Recognize `logged` and stop `parse_role_booleans` from ever returning `None`

In `games/views/common.py`:
- `parse_role_booleans(request)`: drop the `if not roles: return None` early return. Always return the booleans dict, adding `'is_logged': 'logged' in roles` alongside the existing keys. An empty/absent `role` query param now simply yields every key `False` (including `is_logged`), the same as it already does for any unrecognized-only role list.
- Update the docstring: it no longer signals "use the real requester's identity instead" — `permissions.json` becomes a pure function of the query string in every case.

### Step 3 — Simplify `permissions_response`

Still in `games/views/common.py`: `permissions_response` no longer needs the `role_booleans is None` branch (unreachable after Step 2) — always set `response['X-Force-Public-Cache'] = 'true'` and drop the `X-Skip-Cache` branch. Update the docstring accordingly (this endpoint no longer has a "real identity, skip cache" mode).

### Step 4 — Thread `is_logged` through `Roles.from_booleans` and `BasePermissionsSerializer`

- `games/permissions/roles.py`: `Roles.from_booleans` gains an `is_logged=False` parameter (same default-False convention as every other role), and sets `'logged_user': is_logged` in the built booleans dict instead of the hardcoded `True`. Do not touch `_resolve_logged_user`, any other `_resolve_*` method, or the `Roles(user=..., game=..., pc=...)` constructor path — those remain exactly as they are today, serving `EndpointPermission`'s real enforcement elsewhere.
- `games/serializers/base_permissions.py`: `_simulated_roles()` currently returns `None` when `self._roles()` is `None`, then falls through elsewhere to real resolution. Since context `roles` is never `None` after Step 2, simplify `_simulated_roles()` to always call `Roles.from_booleans(...)`, passing `is_logged=roles['is_logged']` alongside the existing four booleans, and drop the now-dead `if roles is None: return None` guard. Update both methods' docstrings to drop the "or None for the real-identity path" framing.

### Step 5 — Update existing tests

- `games/tests/permissions/roles_test.py`: `test_defaults_are_all_false_except_logged_user` (~line 169) — `Roles.from_booleans()` with no args now defaults `is_logged_user()` to `False` too; rename/rewrite this test (and its class docstring, if any) accordingly. Check every other `from_booleans(...)` call in this file: any that relied on the old hardcoded-`True` `logged_user` to represent "a simulated logged-in user" (e.g. the `all_roles()` assertions around line 192) must now pass `is_logged=True` explicitly.
- `games/tests/views/common_test.py`:
  - `TestParseRoleBooleans.test_returns_none_when_no_role_param` (~line 225): rewrite to assert the new all-`False` dict (including `is_logged: False`) is returned instead of `None`.
  - Add a case asserting `?role=logged` sets `is_logged: True` in the parsed dict, mirroring `test_superuser_role`/`test_staff_role_sets_is_staff`.
  - `TestPermissionsResponse.test_real_identity_path_sets_skip_cache_header` (~line 289): this exercised the now-removed `role_booleans is None` branch — delete it (or rewrite it to assert `X-Force-Public-Cache` is always set, if there's a meaningful "no roles at all" case left to test).
- `games/tests/serializers/base_access_test.py`: add a case (mirroring the existing `TestBaseAccessSerializerIsStaff`/`IsPlayer` classes) asserting `is_logged` is `True` for an authenticated user and `False` (never `None`) for an anonymous one.

### Step 6 — Full sanity sweep

Run `grep -rn "logged_user\|parse_role_booleans\|from_booleans" backend/games` (excluding test files already updated) to confirm no other caller assumes the old `None`-signals-real-identity or hardcoded-`True`-`logged_user` behavior.

## Files to Change

- `games/serializers/base_access.py` — add `is_logged`
- `games/views/common.py` — `parse_role_booleans`, `permissions_response`
- `games/serializers/base_permissions.py` — `_simulated_roles`
- `games/permissions/roles.py` — `Roles.from_booleans`
- `games/tests/permissions/roles_test.py` — updated defaults/assertions
- `games/tests/views/common_test.py` — updated `parse_role_booleans`/`permissions_response` tests
- `games/tests/serializers/base_access_test.py` — new `is_logged` coverage

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Do not delete or refactor `Roles._resolve_*`/the `Roles(user=..., game=..., pc=...)` constructor — confirmed shared with `EndpointPermission`'s live authorization checks (`backend/games/permissions/base.py:21`), out of scope for this issue.
- The `logged` query-value name must match exactly what the frontend/translator plans use — coordinate before merging if either side needs to shift the name.
