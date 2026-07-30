# Plan: Refactor permissions.py

Issue: [907-refactor-permissions-py.md](../issues/907-refactor-permissions-py.md)

## Overview

Replace `backend/games/permissions.py` (26 one-per-action classes, ~60 call sites across
views and serializers) with a small package, `backend/games/permissions/`, built around
explicit roles (`logged_user`, `admin`, `staff`, `player`, `dm`, `owner`) and YAML-driven
config, per the issue. This is a full, behavior-preserving migration in one issue: every
current access decision must still hold, `permissions.py` is deleted, and the role-caching
classes in `backend/games/caches/` are retired in favor of role resolution living inside the
new `Roles` class.

See [plan_mapping.md](plan_mapping.md) for the full old-class → new-resource/action mapping
that drives Steps 6-7 below.

## Context

- Global roles (`admin`, `staff`, `logged_user`) work across any game; game-scoped roles
  (`player`, `dm`) require a `Game`; `owner` additionally requires a PC `Character`.
- Endpoints are `regular` (players get mutation access here, in-game) or `restricted`
  (never for players). `DELETE` is its own mutation kind, configured separately — it is
  never implied by `regular`/`restricted` create/update grants.
- `admin`/`dm` always shortcut permission checks to `True` — **except** two existing
  actions that deliberately deny that bypass today (see Notes — Shortcut conflict).
- Only `UIPermission` accepts an injected, pre-resolved roles object (this is what powers
  today's `?role=` simulated-preview path in `GamePermissionsSerializer`/
  `CharacterPermissionsSerializer`/`TreasurePermissionsSerializer`). `EndpointPermission`
  always resolves roles from the real user/game/pc.
- `PermissionConfigStore` keeps its own plain dict (not `MemoryCache`) — see the issue's
  Solution/"Configuration store class" section for why.

## Implementation Steps

### Step 1 — Add a YAML dependency
Add `pyyaml` to `backend/pyproject.toml`'s `[tool.poetry.dependencies]` (confirmed absent
today — `grep -rn "yaml" backend --include=*.py` returns nothing) and run
`poetry lock`/`poetry install` inside `backend/`.

### Step 2 — `Roles` class
Create `backend/games/permissions/roles.py`:
- Constructed with `user=None, game=None, pc=None`.
- `all_roles()` and one predicate per role (`is_admin()`, `is_staff()`, `is_logged_user()`,
  `is_dm()`, `is_player()`, `is_owner()`), following the truth table in the issue (no user →
  no roles; no game → only `admin`/`staff`/`logged_user`; no pc → no `owner`).
- Internally resolves `is_dm`/`is_player` from `game`, and `is_owner` from `pc`, reusing the
  same underlying queries as today's `Game.has_player`/`Character.can_be_edited_by_roles` —
  see [plan_mapping.md](plan_mapping.md) "Role resolution" section for exact source calls.
- Caching: resolve through the existing `MemoryCache` singleton
  (`backend/majora_project/cache/base.py`) directly — new `entry_type`s, keyed by
  `(user.id, game.id, pc.id)` as applicable — rather than through the old
  `AdminOrStaffCache`/`GamePlayerCache`/`CharacterEditorCache` wrapper classes, which are
  being retired (Step 9). This is a legitimate `MemoryCache` use (unlike the config store):
  it scales with user/game count and benefits from eviction, unlike the small, fixed config set.
- Also supports being constructed directly from role booleans (bypassing DB resolution) —
  this is the hook `UIPermission` uses for `?role=` simulation (Step 5).

### Step 3 — `PermissionConfigStore`
Create `backend/games/permissions/config_store.py`:
- `get(resource, permission_type)` → parsed YAML dict (a copy, to keep the cached original
  immutable), `permission_type` being `'endpoints'` or `'ui'`.
- Loads from `backend/games/permissions/config/<resource>/<permission_type>.yml` on first
  request per `(resource, permission_type)`, caching in a plain in-class dict (not
  `MemoryCache` — see Context above).

### Step 4 — `BasePermission`
Create `backend/games/permissions/base.py`:
- Constructed with `user=None, game=None, pc=None, roles=None` (`roles` injectable, easing
  tests — same idea as the current code's docstring precedent).
- Shared shortcut: `admin` or `dm` (of the given game) → always allowed; `everyone` in a
  config list → always allowed. See Notes for the two actions that must NOT use this shortcut.
- Subclassed by `UIPermission` and `EndpointPermission`.

### Step 5 — `UIPermission` and `EndpointPermission`
Create `backend/games/permissions/ui.py` and `backend/games/permissions/endpoint.py`:
- `UIPermission.allowed(resource, action)` — looks up `resource`'s `ui.yml`, checks the
  caller's roles against the listed roles for `action`. This is the only one of the two
  that accepts a pre-resolved `roles` object at construction (the `?role=` path).
- `EndpointPermission.allowed(resource, type, action)` — looks up `resource`'s
  `endpoints.yml`, checks under `type` (`regular`/`restricted`) → `action`
  (`show`/`mutation`/`delete`). Always resolves roles from the real user/game/pc.

### Step 6 — Write the YAML config files
One `config/<resource>/{endpoints,ui}.yml` pair per resource identified in
[plan_mapping.md](plan_mapping.md). Where today's single permission class backs both an
endpoint `check` and a `*PermissionsSerializer` UI boolean for the same rule, the endpoint
and UI YAML for that resource/action must list the same roles (kept as two separate files
per the issue's design, even though they coincide today) — do not let them drift while
transcribing.

### Step 7 — Migrate call sites
Work resource-by-resource per [plan_mapping.md](plan_mapping.md):
- Replace each view's `from ...permissions import <OldClass>` + `<OldClass>.check(request, obj)`
  with an `EndpointPermission(request.user, game, pc).check(request, resource, type, action)`
  call (keep the existing 401/403 `Response` shape so callers don't need to change further).
- Replace each `*PermissionsSerializer`'s direct `<OldClass>.is_allowed[_for_roles]` calls
  with `UIPermission(...).allowed(resource, action)`, passing the injected roles object when
  `self._roles()` is set (the `?role=` path), and the real user/game/pc otherwise.
- Migrate and port every test in `backend/games/tests/permissions_test.py` (2009 lines) to
  cover the new classes with equivalent cases — do not drop coverage, since this is a
  behavior-preserving migration.

### Step 8 — Delete the old code
Delete `backend/games/permissions.py` and `backend/games/tests/permissions_test.py` (once
superseded) after Step 7 confirms no remaining imports
(`grep -rn "from .*permissions import" backend/games` should only match the new package).

### Step 9 — Retire the old cache classes
Delete `backend/games/caches/admin_or_staff_cache.py`, `character_editor_cache.py`,
`game_player_cache.py`, `boolean_check_cache.py` and their tests under
`backend/games/tests/caches/`, now that `Roles` resolves the same facts directly against
`MemoryCache`. Leave `backend/majora_project/cache/base.py` (`MemoryCache` itself) untouched.

## Files to Change

- `backend/pyproject.toml` — add `pyyaml` dependency.
- `backend/games/permissions/__init__.py`, `roles.py`, `base.py`, `ui.py`, `endpoint.py`,
  `config_store.py` — new package (replaces `backend/games/permissions.py`, deleted).
- `backend/games/permissions/config/<resource>/{endpoints,ui}.yml` — new, one pair per
  resource in [plan_mapping.md](plan_mapping.md).
- All ~55 view files and 3 `*_permissions.py` serializers listed by
  `grep -rl "permissions import" backend/games --include=*.py | grep -v /tests/` — switch
  to the new classes.
- `backend/games/tests/permissions_test.py` — replaced by per-new-class test files under
  `backend/games/tests/permissions/`.
- `backend/games/caches/{admin_or_staff_cache,character_editor_cache,game_player_cache,boolean_check_cache}.py`
  and their tests — deleted.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov` (CI job `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job `pytest_all`, covers the new `permissions` package's own tests)

## Notes

- **Shortcut conflict (important)**: the issue's global Shortcut principle says `admin`/`dm`
  always bypass. Two existing actions deliberately violate that: `SessionMessagePermission.check_create`
  and `PollVotePermission.check_vote` both check only `game.has_player(user)` — a superuser
  or staff account who is *not* also a player/DM of that specific game is denied. Preserving
  exact behavior (the confirmed decision) means `session_message.create` and `poll.vote`
  must be modeled as **not** using `BasePermission`'s automatic admin/staff shortcut — e.g.
  an explicit `no_shortcut: true` marker in those two resources' `endpoints.yml`, or a
  bespoke override on `EndpointPermission` for just those actions. Do not silently apply the
  universal shortcut here; audit every one of the 26 classes in
  [plan_mapping.md](plan_mapping.md) against its current code for similar narrow exclusions
  before assuming the generic shortcut applies.
- `CharacterItemCreatePermission` is reused today, unchanged, by the item acquire/remove
  endpoints (issue #773) in addition to item creation — make sure the migrated
  `game_pc_item`/`game_npc_item` resource config covers all three call sites with the same rule.
- `GameSessionEditPermission.check` accepts either a `Game` or a `GameSession` as `obj`
  (resolving to the underlying game either way) — the migrated endpoint check needs the
  same dual-input handling, or its two call sites (create vs. update) need to be adapted to
  always pass the `Game`.
- No product-owner/data-access/security review agents are needed for this plan itself since
  it's an internal refactor with no new endpoints or field exposure — but the `auto-fix`
  pipeline's usual `data-access`/`security` review pass over the resulting diff still applies
  before merge, precisely because this touches every permission-checked endpoint in the app.
