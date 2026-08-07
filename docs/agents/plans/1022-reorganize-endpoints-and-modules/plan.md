# Plan: Reorganize endpoints and modules

Issue: [1022-reorganize-endpoints-and-modules.md](../../issues/1022-reorganize-endpoints-and-modules.md)

## Overview

Pure internal reorg of the backend's non-`games` API surface, split into four
independent moves: extract a `staff` app and a `permissions` app out of
`games`, split `accounts/urls.py` and `miniatures/urls/` into per-resource
files matching the `games/urls/` pattern, and rescope the still-unused
`miniatures` routes under `stl_models`. Every currently-consumed endpoint
keeps its exact path. In addition, since this issue introduces a new
centralized, cross-domain config tree, the architect adds a `permissions`
specialist agent and updates `data-access`'s charter to route
permission-config findings to it — a root-level, cross-cutting task done
directly by the architect rather than by any single specialist.

## Context

`games/urls/` already follows a one-file-per-resource pattern
(`games.py`, `pcs.py`, `treasures.py`, ...). `staff.py`, `permissions.py`,
and part of `system.py` inside that same package are not game-specific at
all — `staff.py` is user/cache administration, and the `games/permissions/`
package backing `permissions.py` is a generic, YAML-config-driven engine
(`PermissionConfigStore`, `BasePermission`, `EndpointPermission`/
`UIPermission`, `PagePermissionConfigStore`, `ResourcePermissionsResolver`,
`PermissionsBuilder`) with only `Roles` (role resolution from a concrete
`user`/`game`/`pc`) actually games-specific. `accounts/urls.py` and
`miniatures/urls/__init__.py` never got the per-resource url-file treatment
`games` has, even though `accounts/views/` is already split into
subpackages. `uploads.py` and `ready.json` stay in `games` (deeply coupled
to games photo/document models, or domain-agnostic infra respectively) —
confirmed during discussion, no action needed. No models/tables move as
part of this issue.

## Implementation Steps

### Step 1 — Extract the `staff` app

Create a new `staff` Django app:

- Move `games/views/staff/*.py` → `staff/views/`, `games/serializers/staff/*.py`
  → `staff/serializers/`, `games/urls/staff.py` → `staff/urls.py` (as
  `staff/urls.py`, a single flat file — only 7 routes, no per-resource split
  needed), `games/tests/views/staff/*.py` → `staff/tests/`.
- Update imports in the moved files: they call into `games`' shared helpers
  (`require_staff`, `validated_or_error`, `paginated_list_response` from
  `games/views/common.py`; the `restricted` decorator from
  `games/decorators.py`) and `accounts.models`/`accounts.authentication` —
  these stay as cross-app imports from the new `staff` app, unchanged in
  spirit, just repointed to the new module paths for the moved files
  themselves.
- Remove the staff re-export from `games/serializers/__init__.py`.
- Remove `staff` from `games/urls/__init__.py`'s aggregation
  (`games/urls/__init__.py`'s `urlpatterns` drops the `staff.urlpatterns`
  term and the `staff` import).
- Register `staff` in `majora_project/settings.py`'s `INSTALLED_APPS` (after
  `games`, alongside `accounts`/`miniatures`) and wire `staff/urls.py` into
  `majora_project/urls.py` via `path('', include('staff.urls'))`.
- No migrations needed — no models move, `staff` has none of its own.

### Step 2 — Split `accounts/urls.py` into a package

Convert `accounts/urls.py` into an `accounts/urls/` package, mirroring
`accounts/views/`'s existing subpackages:

- `urls/auth.py` — `users/login.json`, `users/logout.json`,
  `users/register.json`, `users/status.json`, `users/test-email.json`,
  `users/language.json`, `users/account.json`.
- `urls/password_reset.py` — `users/recover.json`,
  `users/reset-password.json`.
- `urls/authorization_requests.py` — `users/authorization_requests.json`,
  `users/authorization_requests/<uuid:uuid>.json`,
  `account/authorization_requests.json`,
  `account/authorization_requests/<uuid:uuid>/deny.json`,
  `account/authorization_requests/<uuid:uuid>/authorize.json`.
- `urls/__init__.py` — aggregates the three:
  `urlpatterns = auth.urlpatterns + password_reset.urlpatterns + authorization_requests.urlpatterns`.
- Delete the old flat `accounts/urls.py`.
- Route path strings are copied verbatim — no path changes.
- The `users/*` vs `account/*` prefix split inside
  `authorization_requests.py` is deliberately left as-is here (tracked
  separately in [#1023](https://github.com/darthjee/majora/issues/1023)).

### Step 3 — Extract the `permissions` engine into a new app

Create a new top-level `permissions` app holding the generic engine and the
centralized config tree:

- Move `games/permissions/base.py`, `config_store.py`, `endpoint.py`,
  `ui.py`, `page_config_store.py`, `resource_resolver.py`, `builder.py` →
  `permissions/` (same filenames), plus `games/permissions/config/**` →
  `permissions/config/**` (the full YAML tree: `game*/`, `pages/`,
  `player/`, `poll*/`, `session_message/`, `treasure/`).
- `permissions/__init__.py` re-exports `PermissionConfigStore`,
  `UIPermission`, `EndpointPermission`, `PagePermissionConfigStore`,
  `ResourcePermissionsResolver`, `PermissionsBuilder` (everything except
  `Roles`).
- `games/permissions/roles.py` stays in place as `games/roles.py` (or stays
  as a one-file `games/permissions/` package containing only `roles.py` and
  its `__init__.py` re-exporting `Roles` — pick whichever keeps
  `games/serializers/*permissions*.py` imports simplest) since `Roles` is
  games-specific and none of the moved engine files import it directly
  (callers inject a `roles=` object; confirmed no circular dependency).
- Update the 7 confirmed consumers to import from `permissions` instead of
  `games.permissions`: `games/serializers/base_permissions.py`,
  `games/serializers/characters/character_permissions.py`,
  `games/serializers/games/game_permissions.py`,
  `games/serializers/treasures/treasure_permissions.py`,
  `games/views/__init__.py`, `games/views/common.py`,
  `games/views/upload_finalize.py`, and the test
  `games/tests/views/common_test.py`.
- Move `games/tests/permissions/*.py` (`base_test.py`, `builder_test.py`,
  `config_store_test.py`, `endpoint_test.py`, `page_config_store_test.py`,
  `resource_resolver_test.py`, `ui_test.py`) → `permissions/tests/`;
  `games/tests/permissions/roles_test.py` stays under `games/tests/` next
  to wherever `roles.py` ends up.
- `permissions/*.json` routes stay defined in `games/urls/permissions.py` as
  today — only the engine code they call into moves; no path changes.
- Register `permissions` in `INSTALLED_APPS` (it has no urls.py of its own
  and needs no wiring into `majora_project/urls.py`, unless a views/urls
  layer is later added on top of it).
- No migrations needed — the engine has no models, only YAML config.

### Step 4 — Rescope `miniatures` urls

- Add `miniatures/urls/stl_models.py` holding the two existing routes,
  renamed:
  - `miniatures.json` → `miniatures/stl_models.json` (`stl_models_list`)
  - `miniatures/<int:stl_model_id>.json` →
    `miniatures/stl_models/<int:stl_model_id>.json` (`stl_model_detail`)
- `miniatures/urls/__init__.py` aggregates via
  `urlpatterns = stl_models.urlpatterns` (ready for `urls/tags.py`,
  `urls/sources.py` later).
- View/test function names (`stl_models_list`, `stl_model_detail`, ...) are
  unaffected — only the `path()` string literals move into the new file.
- Confirmed zero consumers anywhere (frontend, `navi` cache-warmer config,
  proxy rules) — safe to rename since unreleased.

### Step 5 — Add the `permissions` specialist agent (architect, root-level)

Done directly by the architect, not delegated to `backend` — agent
definitions under `.claude/agents/` are root-level, cross-cutting files.

- Create `.claude/agents/permissions.md`, mirroring `.claude/agents/cache.md`'s
  shape: owns the new `permissions` app in full (engine code *and* every
  domain's YAML config under `permissions/config/`), `tools: Read, Edit,
  Write, Bash`. Other domains ask this agent to add/adjust a resource's
  rules rather than editing `permissions/config/` themselves.
- Update `.claude/agents/data-access.md`'s charter: when a finding concerns
  `permissions/config/*.yml` rules specifically, route it to the
  `permissions` agent for the fix, instead of the generic "appropriate
  specialist agent" wording. `data-access` stays read-only — no tools
  change.

## Files to Change

- `backend/staff/` — new app: `views/`, `serializers/`, `urls.py`,
  `tests/`, `apps.py`, `__init__.py`, `migrations/__init__.py`.
- `backend/games/views/staff/` — removed (moved to `staff/views/`).
- `backend/games/serializers/staff/` — removed (moved to
  `staff/serializers/`); `games/serializers/__init__.py` — drop the staff
  re-export.
- `backend/games/urls/staff.py` — removed (moved to `staff/urls.py`);
  `games/urls/__init__.py` — drop `staff` from the import/aggregation.
- `backend/games/tests/views/staff/` — removed (moved to `staff/tests/`).
- `backend/majora_project/settings.py` — add `staff` and `permissions` to
  `INSTALLED_APPS`.
- `backend/majora_project/urls.py` — add
  `path('', include('staff.urls'))`.
- `backend/accounts/urls.py` — removed, replaced by `backend/accounts/urls/`
  (`__init__.py`, `auth.py`, `password_reset.py`,
  `authorization_requests.py`).
- `backend/permissions/` — new app: `base.py`, `config_store.py`,
  `endpoint.py`, `ui.py`, `page_config_store.py`, `resource_resolver.py`,
  `builder.py`, `config/**`, `tests/`, `apps.py`, `__init__.py`,
  `migrations/__init__.py`.
- `backend/games/permissions/` — reduced to just `roles.py` (+ its
  `__init__.py`) or moved to `games/roles.py`; config/engine files removed
  (moved to `permissions/`).
- `backend/games/serializers/base_permissions.py`,
  `backend/games/serializers/characters/character_permissions.py`,
  `backend/games/serializers/games/game_permissions.py`,
  `backend/games/serializers/treasures/treasure_permissions.py`,
  `backend/games/views/__init__.py`, `backend/games/views/common.py`,
  `backend/games/views/upload_finalize.py`,
  `backend/games/tests/views/common_test.py` — repoint imports from
  `games.permissions` to `permissions` (keep `Roles` imported from wherever
  it ends up in `games`).
- `backend/games/tests/permissions/` — split: engine tests move to
  `backend/permissions/tests/`, `roles_test.py` stays under
  `backend/games/tests/`.
- `backend/miniatures/urls/__init__.py`,
  `backend/miniatures/urls/stl_models.py` (new) — path rename.
- `.claude/agents/permissions.md` (new), `.claude/agents/data-access.md`
  (charter update).

## CI Checks

- `backend`: `poetry run pytest --cov --cov-report=lcov:coverage/lcov.info`
  (CI jobs: `pytest_all`, `pytest_views_rest`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `bin/reports.sh ci` (CI job: `checks`, Python complexity)

## Notes

- Pure structural reorg — no behavior change, no API contract change, except
  the `miniatures` path rename (Step 4), which is safe because the endpoint
  has zero current consumers.
- No database migrations are needed anywhere in this plan: no models move,
  and the new `staff`/`permissions` apps introduce no models of their own.
- Steps 1–4 are independent of each other and can be implemented/reviewed in
  any order or split across separate PRs if preferred; Step 5 has no code
  dependency on Steps 1–4 and can happen in parallel.
- The `users/*` vs `account/*` prefix convention inside
  `accounts/urls/authorization_requests.py` is explicitly out of scope here
  — tracked in [#1023](https://github.com/darthjee/majora/issues/1023).
