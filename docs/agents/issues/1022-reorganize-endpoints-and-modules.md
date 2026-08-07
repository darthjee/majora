# Issue: Reorganize endpoints and modules

## Description

`/games/....json` endpoints are already well organized inside the `games`
module (per-resource files under `games/urls/`). Everything else grew ad hoc:
some genuinely game-specific logic lives correctly in `games`, but several
concerns that aren't game-specific at all (staff/user administration,
generic permission checks, upload finalization, system/infra endpoints) are
also bundled inside `games`, and other apps (`accounts`, `miniatures`) never
got the same per-resource url-file treatment `games` has.

## Problem

- `accounts` app: 13 routes in one flat `accounts/urls.py`, even though
  `accounts/views/` is already split into `auth/`, `authorization_requests/`,
  `password_reset/` subpackages.
- `miniatures` app: 2 routes, flat `miniatures/urls/__init__.py`, generically
  named (`miniatures.json`) rather than scoped to the underlying `StlModel`
  resource.
- Inside `games` but not game-specific:
  - `staff.py` (`staff/users*.json`, `staff/cache*.json`) — user/cache
    administration.
  - `permissions.py` (`permissions/*.json`) — a generic, YAML-config-driven
    permission engine, with only the `Roles` resolver actually games-specific.
  - `uploads.py` (`uploads/(image|file)/<id>.json`) — generic upload
    finalize, but deeply coupled to games photo/document models, so this one
    is correctly placed.
  - `system.py` (`ready.json`, `access-route-config.json`) — infra/system,
    not game-domain at all (though `access-route-config.json` does serve
    games-domain page-access data, so it stays).
- `conversations`, `domains`, `statistics`, `versioning` have no endpoints
  (models/middleware only) — out of scope for this issue.
- The centralized permission engine has no clear write-owner: it's touched by
  every domain's serializers, but no specialist agent is scoped to it, and
  extending `data-access` (read-only reviewer) to own it would make it both
  author and reviewer of the same access-control artifacts.

## Solution

### Staff module extraction

Extract a new `staff` Django app out of `games`:

- Move `games/views/staff/` → `staff/views/`, `games/serializers/staff/` →
  `staff/serializers/`, `games/urls/staff.py` → `staff/urls.py`,
  `games/tests/views/staff/` → `staff/tests/`.
- Register `staff` in `INSTALLED_APPS` and wire `staff/urls.py` into
  `majora_project/urls.py` the same way `accounts`/`miniatures` are.
- Keep shared helpers (`require_staff`, `validated_or_error`,
  `paginated_list_response` from `games/views/common.py`; the `restricted`
  decorator from `games/decorators.py`) in `games` — they're used well beyond
  staff (e.g. `accounts/views/auth/email.py`, `games/caches/`), so the new
  `staff` app just imports them from `games`, same as `accounts` already does.
- Confirmed no circular-dependency risk: nothing outside `games/views/staff/`,
  `games/serializers/staff/`, `games/urls/staff.py`,
  `games/tests/views/staff/` references those paths except the re-export in
  `games/serializers/__init__.py`, which gets removed.
- URL paths (`staff/*.json`) stay identical — pure module reorg, no API
  changes, no frontend impact.
- The 7 staff endpoints span two sub-concerns (5 user-admin, 2 cache-admin)
  but share the `require_staff` gate and `staff/` prefix — kept together in
  one app rather than splitting further.

### Accounts module extraction

Convert `accounts/urls.py` (single flat file) into an `accounts/urls/`
package, mirroring the `games/urls/` pattern and the existing
`accounts/views/` subpackages:

- `urls/auth.py` — `users/login.json`, `users/logout.json`,
  `users/register.json`, `users/status.json`, `users/test-email.json`,
  `users/language.json`, `users/account.json` (from `views/auth/`)
- `urls/password_reset.py` — `users/recover.json`, `users/reset-password.json`
  (from `views/password_reset/`)
- `urls/authorization_requests.py` — `users/authorization_requests.json`,
  `users/authorization_requests/<uuid>.json`,
  `account/authorization_requests.json`,
  `account/authorization_requests/<uuid>/deny.json`,
  `account/authorization_requests/<uuid>/authorize.json` (from
  `views/authorization_requests/`)
- `urls/__init__.py` — aggregates the three via
  `urlpatterns = auth.urlpatterns + password_reset.urlpatterns + authorization_requests.urlpatterns`

Pure file-structure move — paths stay identical. The `users/*` vs `account/*`
prefix split inside `authorization_requests.py` is deliberately **not**
resolved here — deferred to
[#1023](https://github.com/darthjee/majora/issues/1023) to decide whether to
unify the prefixes or keep them as intentional (self-service vs. target-user
actions).

### Permissions engine extraction

The `games/permissions/` package is actually two layers, only one of which is
games-specific:

- **Generic, YAML-driven engine** (no games coupling): `PermissionConfigStore`
  (loads `config/<resource>/<endpoints|ui>.yml`), `BasePermission` (checks an
  injectable `roles` object against a YAML entry), `EndpointPermission` /
  `UIPermission`, `PagePermissionConfigStore`, `ResourcePermissionsResolver`,
  `PermissionsBuilder`.
- **Games-specific**: `Roles` (resolves `admin/staff/logged_user/dm/player/owner`
  from a concrete `user`/`game`/`pc`, via `game.has_player()`/`pc.player`), plus
  the YAML content itself (`config/game/`, `config/treasure/`, `config/pages/`,
  ...) and the views/serializers that call into the engine
  (`games/views/permissions/`, `games/serializers/*permissions*.py`).

Extract the generic engine into a new top-level `permissions` app
(centralized — config for every domain lives under `permissions/config/`,
not scattered per-domain), bundled into this issue rather than split out.
`games.Roles` and the games-domain YAML/views/serializers stay where they are
and consume the new app, the same way `staff` will consume `games`' shared
helpers after its own extraction. `permissions/*.json` (the entity-agnostic
endpoints) stay defined in `games/urls/permissions.py` as today; only the
engine code they call into moves.

**New `permissions` specialist agent** (mirrors `cache`'s ownership of
`navi/*.yml`): owns the new `permissions` app in full — the engine code *and*
every domain's YAML config — since centralizing config only closes the
write-ownership gap if someone other than each domain's own agent is
responsible for it. Other domains (`games`, `staff`, `accounts`, `miniatures`,
...) keep writing their own views/serializers that call into the engine
(cross-app import, same shape `staff` already has into `games`), but ask the
`permissions` agent to add/adjust a resource's rules rather than editing
`permissions/config/` themselves.

**`data-access` stays read-only**, but its charter gets a small update: when
a finding concerns the centralized `permissions/config/*.yml` rules
specifically (missing/incorrect resource entry, wrong role list, etc.), route
that finding to the `permissions` agent for the fix, instead of the generic
"appropriate specialist agent" — deliberately keeping `data-access` a pure
reviewer with no edit rights (extending it to also write was considered and
rejected: it would make it both author and reviewer of the same
access-control artifacts).

### Miniatures scoping

`miniatures` is the one part of this issue where an actual URL path rename is
in scope, not just a file-internal move: confirmed there are zero consumers
of the current endpoints anywhere (no frontend code, no `navi` cache-warmer
config, no proxy rules reference `miniatures.json`/`stl_model` at all) — it's
a new, not-yet-used endpoint.

Scope the routes under the underlying resource name, matching the
`StlModel` model (`miniatures/models/stl_model.py`) — the app also already
has `StlModelLink`, `StlModelPhoto`, `Source`, `Tag`, so there's room to grow
beyond a single resource.

| Current | New |
|---|---|
| `miniatures.json` | `miniatures/stl_models.json` |
| `miniatures/<int:stl_model_id>.json` | `miniatures/stl_models/<int:stl_model_id>.json` |

`miniatures/urls/__init__.py` gets a real per-resource file for this,
matching the `games`/`accounts` pattern: `urls/stl_models.py` holding these
two routes, aggregated via `__init__.py` — ready for `urls/tags.py`,
`urls/sources.py`, etc. as those get their own endpoints later. View/test
names (`stl_models_list`, `stl_model_detail`, ...) are unaffected — only the
`path()` string literals change.

## Benefits

- Clear module boundaries: every app owns only what's actually its domain,
  matching the already-established `games/urls/` per-resource pattern.
- A real write-owner for the centralized permission config, closing the gap
  where no specialist agent was scoped to it and avoiding overloading the
  read-only `data-access` reviewer.
- Pure internal reorg — every currently-consumed endpoint keeps its exact
  path; the one actual path change (`miniatures`) is safe specifically
  because it's unreleased.
