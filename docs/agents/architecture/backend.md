# Backend (backend/)

All Django source code lives under `backend/`. The backend owns data and business logic.

## majora_project/

Django project package: `settings.py`, root `urls.py`, `wsgi.py`. Entry point for the Django application.

## games/

Core Django app containing domain models, REST views, and serializers for RPG campaign data.

- `models/` — Domain models (see AGENTS.md for current list).
- `views/` — Function-based API views using `@api_view` (one file per view/route).
- `serializers/` — DRF serializers (one class per file).
- `paginator.py` — Custom pagination for list endpoints.
- `urls.py`, `migrations/`, `tests/`, `admin.py`.

Authoritative sources: `backend/games/urls.py` and `backend/games/models/`.

## accounts/

Account/authentication app — every `/users/*.json` and `/account/*.json` endpoint (login, logout, register, status, account management, password reset, authorization requests).

Key files:

- `models/` — `UserProfile` (table `games_userprofile` preserved for migration compatibility), `PasswordResetToken`.
- `views/auth/`, `views/password_reset/`, `views/authorization_requests/`
- `serializers/auth/`
- `authentication.py` — `CookieTokenAuthentication`
- `urls/` — one file per sub-concern (`auth.py`, `password_reset.py`,
  `authorization_requests.py`), aggregated via `urls/__init__.py`, mirroring `games/urls/`'s
  per-resource pattern.
- `templates/accounts/`, `migrations/`, `tests/`.

## staff/

User/cache administration app — every `/staff/*.json` endpoint (list/approve/deny/detail
users, send a recovery link, clear/summarize the cache). Extracted out of `games` since none
of it is game-domain logic; it consumes `games`' shared helpers (`require_staff`,
`validated_or_error`, `paginated_list_response` from `games/views/common.py`, the
`restricted` decorator from `games/decorators.py`) as cross-app imports, the same way
`accounts` does.

- `views/`, `serializers/`, `urls.py` (flat — only 7 routes), `tests/`, `migrations/`
  (no models of its own).

## uploads/

Neutral, cross-app upload engine (issue #1067). Extracted out of `games` because `miniatures`
views needed it too — `miniatures` depending on `games`'s internal upload modules was a
backwards dependency (a domain app reaching into another domain app's internals). Flat-file
app, mirroring the `permissions/`/`common/` convention (one model, one view — no
`models/`/`views/` packages):

- `models.py` — `Upload` (`GenericForeignKey`-based lifecycle tracker for a pending
  photo/file upload). Kept pointing at the pre-existing `games_upload` DB table via an
  explicit `Meta.db_table = 'games_upload'` — the model's app moved, the table did not
  (`uploads/migrations/0001_initial.py` / `games/migrations/0091_move_upload_to_uploads_app.py`
  are a state-only `SeparateDatabaseAndState` pair with no `database_operations`, following the
  same add-then-remove app-split precedent as `domains/migrations/0001_initial.py` /
  `games/migrations/0090_move_domain_models_to_domains_app.py`, minus that precedent's table
  rename).
- `upload_initiator.py` (`UploadInitiator`) — shared validate-and-create helper behind every
  upload-init endpoint; still relies on `games.serializers.PhotoUploadSerializer`/
  `FileUploadSerializer` and `games.views.common.validated_or_error`, which stay in `games`.
- `photo_path.py` (`PhotoPathBuilder`, `normalize_path_segment`) — shared storage-path
  sanitization/building.
- `views.py` (`upload_finalize`) — the `PATCH /uploads/(image|file)/<id>.json` endpoint, plus
  its `_PHOTO_HANDLERS` dispatch registry (`permission_check`, `mark_ready` per content-object
  type). This is the one place `uploads` legitimately depends back on `games` and `miniatures`
  (`games.views.common.{check_game_edit,require_staff}` and both apps' photo/file models) — the
  registry has to know every content-object type it dispatches on.
- `urls.py` — the finalize route, included directly from `majora_project/urls.py`.

The ~13 thin per-entity init views (photo/item/treasure/document uploads in `games/`;
source/stl-model/collection photo uploads in `miniatures/`) stay in their owning apps and
import `UploadInitiator`/`PhotoPathBuilder` from here.

## permissions/

Generic, YAML-config-driven permission engine, centralized here so every domain (`games`,
`staff`, `accounts`, `miniatures`, ...) shares one write-owner for cross-domain access
config instead of each domain reinventing it. Owned by the `permissions` specialist agent.

- `base.py` (`BasePermission`), `config_store.py` (`PermissionConfigStore`),
  `endpoint.py` (`EndpointPermission`), `ui.py` (`UIPermission`),
  `page_config_store.py` (`PagePermissionConfigStore`),
  `resource_resolver.py` (`ResourcePermissionsResolver`), `builder.py`
  (`PermissionsBuilder`) — re-exported from `__init__.py`.
- `config/` — the YAML rule tree, one directory per resource (`game/`, `game_pc/`,
  `game_npc/`, `treasure/`, `pages/`, `player/`, `poll/`, `session_message/`, ...).
- `tests/`, `migrations/` (no models of its own).

Games-specific role resolution (`Roles`, resolving `admin/staff/logged_user/dm/player/owner`
from a concrete `user`/`game`/`pc`) stays in `games/roles.py` and is injected into the engine
as the `roles=` object — `permissions/` never imports a concrete domain role resolver
directly. `permissions/*.json` HTTP routes stay defined in `games/urls/permissions.py`; only
the engine code and config they call into live here.

## miniatures/

`StlModel`/`StlModelLink`/`StlModelPhoto`/`Source`/`Tag`/`Collection`/`CollectionPhoto` models
for the miniature-scanning feature. Routes are scoped under the underlying resource name
(`miniatures/stl_models*.json`, `miniatures/collections*.json`), mirroring `games/urls/`'s
per-resource pattern via `urls/stl_models.py`/`urls/collections.py`.

## versioning/

Change-history infrastructure wrapping `django-simple-history`. Tracks full snapshots of saves/deletes for many `games` models; history tables are placed under `versioning/migrations/`. History is exposed only via Django Admin; no API endpoints are introduced by versioning.
