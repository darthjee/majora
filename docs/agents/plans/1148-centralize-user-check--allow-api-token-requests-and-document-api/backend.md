# Backend Plan: Centralize user check, allow api token requests and document api

Main plan: [plan.md](plan.md)

## Overview

`CookieTokenAuthentication` (`backend/accounts/authentication.py`) already handles both the
`Authorization: Token <key>` header and the `auth_token` session cookie, and is already the
DRF-wide default (`REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` in
`backend/majora_project/settings.py`). This plan is pure cleanup: remove the redundant
per-view redeclaration of that same default, consolidate duplicated "require authenticated
user" helpers where safe, and replace one ad-hoc manual auth instantiation with the standard
path. No new authentication behavior — this must be behavior-preserving.

## Implementation Steps

### Step 1 — Remove redundant `@authentication_classes([CookieTokenAuthentication])` decorators

Find every occurrence:

```bash
grep -rl "authentication_classes(\[CookieTokenAuthentication\])" backend --include="*.py"
```

(110 occurrences across ~108 files as of this plan, e.g. `backend/games/views/games/game_detail.py:16`,
`backend/miniatures/views/stl_model_photo_upload.py:19`, `backend/uploads/views.py:33`,
`backend/staff/views/staff_users_list.py:19`.)

For each match, remove the `@authentication_classes([CookieTokenAuthentication])` decorator
line. Where `authentication_classes` (and/or `CookieTokenAuthentication`, if imported
directly) becomes unused in that file as a result, remove the now-unused import too — run
`ruff check backend/` (see CI Checks below) to catch any left behind.

**Do not touch** the three views that intentionally opt out of the default with
`@authentication_classes([])` — these must keep authenticating no one:
- `backend/accounts/views/auth/status.py`
- `backend/games/views/access_route_config.py`
- `backend/games/views/ready.py`

The grep pattern above only matches the exact `[CookieTokenAuthentication]` form, so it
naturally excludes these three already — just don't touch them if editing nearby lines.

### Step 2 — Replace the ad-hoc manual `TokenAuthentication()` instantiation

`backend/accounts/views/auth/status.py:30` manually instantiates
`TokenAuthentication()` by hand instead of relying on the standard authentication path (this
view uses `@authentication_classes([])`, so it needs to keep doing token lookup itself for its
own status-check logic — just do it through the same `CookieTokenAuthentication`/DRF
`TokenAuthentication` machinery used elsewhere instead of a bespoke instantiation). Read the
surrounding view logic first to confirm the replacement preserves its current behavior exactly
(this endpoint reports auth status, so subtle differences would be user-visible).

### Step 3 — Consolidate duplicated "require authenticated user" helpers (best-effort)

Three call sites currently reimplement `if not request.user or not
request.user.is_authenticated` independently:
- `backend/games/views/common.py:36` (`require_authenticated`)
- `backend/permissions/endpoint.py:36` (`EndpointPermission._unauthenticated_response`)
- `backend/games/serializers/_request_context_mixin.py:17`

Look at consolidating these into a single shared helper. Only do this if it doesn't conflict
with how each call site is currently used (different return types/response shapes are likely
across these three — a serializer mixin, a view helper, and a permission class are different
contexts). If consolidation would force an awkward shared abstraction, it's fine to leave
these as-is and note why in this file's Notes section — this part of the issue was explicitly
phrased as "look at consolidating," not a hard requirement.

## Files to Change

- ~108 files under `backend/games/views/`, `backend/miniatures/views/`, `backend/uploads/`,
  `backend/staff/views/` (and any others matched by the Step 1 grep) — remove redundant
  `@authentication_classes([CookieTokenAuthentication])` decorator (+ now-unused import where
  applicable)
- `backend/accounts/views/auth/status.py` — replace manual `TokenAuthentication()`
  instantiation with the standard path
- `backend/games/views/common.py`, `backend/permissions/endpoint.py`,
  `backend/games/serializers/_request_context_mixin.py` — consolidate duplicated
  authentication-required checks, if feasible without behavior changes

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_game`,
  `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: lint step in
  `.circleci/config.yml`)

## Notes

- This is a cleanup-only change with no new auth logic — the existing test suite is the
  correctness net (see the issue's "Testing strategy" section). No new tests expected unless
  Step 2's replacement or Step 3's consolidation changes an observable response shape, in
  which case add/update tests for that specific view only.
- If Step 3's consolidation isn't clean, skip it and note here which call sites were left
  untouched and why.
