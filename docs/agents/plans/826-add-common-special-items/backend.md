# Backend Plan: Add common special items

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the model, API surface, and permissions config described in [plan.md](plan.md)'s
"Shared contracts" section in full — frontend, translator, and cache all consume it as
documented there. No contract is consumed from another agent (backend is the root producer here).

## Implementation Steps

### Step 1 — Models

- `backend/games/models/game/game_common_item.py`: `GameCommonItem`, mirroring
  `backend/games/models/game/game_possession.py` exactly in shape, plus `price` (`IntegerField`)
  and `category` (`CharField(max_length=16, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER)`
  with class constants `CATEGORY_POTION`/`CATEGORY_DRUG`/`CATEGORY_CONSUMABLE`/
  `CATEGORY_AMMUNITION`/`CATEGORY_POISON`/`CATEGORY_GEAR`/`CATEGORY_OTHER`, following
  `Game.GAME_TYPE_CHOICES`'s convention). `related_name='common_items'` on the `game` FK.
- `backend/games/models/game/game_common_item_photo.py`: `GameCommonItemPhoto(BasePhoto)`,
  mirroring `game_possession_photo.py` (FK `game_common_item`, `related_name='photos'`).
- Register both in `backend/games/models/__init__.py` (wherever `GamePossession`/
  `GamePossessionPhoto` are currently exported).
- `python manage.py makemigrations games` — model migration.
- Historical model: add `HistoricalGameCommonItem` via `python manage.py makemigrations
  versioning` (mirrors `HistoricalGamePossession`'s migration).

### Step 2 — Serializers

`backend/games/serializers/games/common_items/` (new package, mirroring
`backend/games/serializers/games/possessions/`):
- `game_common_item_list.py`: `GameCommonItemListSerializer` (`id`, `name`, `photo_path`,
  `price`, `category`) and `GameCommonItemAllListSerializer` (+ `HiddenFieldMixin`, adds
  `hidden`) — same inheritance shape as `GamePossessionListSerializer`/
  `GamePossessionAllListSerializer`.
- `game_common_item_detail.py` (or fold into the same file, matching whatever the possessions
  package does): `GameCommonItemDetailSerializer` (extends list, adds `description`) and
  `GameCommonItemDetailFullSerializer` (+ `HiddenFieldMixin`, extends detail, adds `hidden`).
- `game_common_item_update.py`: `GameCommonItemUpdateSerializer` — `name`, `description`,
  `price`, `category`, `hidden`, all `required=False` via the same `extra_kwargs`
  dict-comprehension `GamePossessionUpdateSerializer` uses.
- `game_common_item_permissions.py`: `GameCommonItemPermissionsSerializer` — entity-agnostic
  `can_edit` via `PermissionsBuilder(page_key='game_common_item', ...)`, mirroring
  `GamePossessionPermissionsSerializer` exactly.
- Export all four from `backend/games/serializers/__init__.py`.

### Step 3 — Permissions config

- `backend/permissions/config/game_common_item/endpoints.yml`: `regular: {create: [staff,
  player], photo_upload: [staff, player], edit: [staff, player]}`, same shape and same header
  comment style as `backend/permissions/config/game_possession/endpoints.yml`.
- `backend/permissions/config/game_common_item/ui.yml`: `edit: [staff, player]`, mirroring
  `game_possession/ui.yml`.

### Step 4 — Views

`backend/games/views/games/`, mirroring the possession views file-for-file:
- `game_common_items.py` — `GET` (list `hidden=False`, `paginated_list_response`) / `POST`
  (delegates to `_common_item_create.py`), `AllowAny` decorated (inline `EndpointPermission`
  check gates POST), same shape as `game_possessions.py`.
- `_common_item_create.py` — `_GameCommonItemCreateSerializer` (`name` required, `price`
  required, `description`/`category`/`hidden` optional) + `game_common_item_create(request,
  game)`, mirroring `_possession_create.py`.
- `game_common_items_all.py` — DM/staff-only via `check_game_edit`, all incl. hidden,
  `X-Skip-Cache: true`, mirrors `game_possessions_all.py`.
- `game_common_item_detail.py` — `GET`/`PATCH`, mirrors `game_possession_detail.py`. Consider
  using the newer shared `detail_or_update`/`_update` helpers in `views/common.py` (used by
  `game_detail.py`/`treasure_detail.py`/`game_session_detail.py`) instead of a fully bespoke
  `_update_*` function — `game_possession_detail.py` predates that helper and doesn't use it, but
  a new entity has no reason to repeat the older, more duplicated pattern.
- `game_common_item_detail_full.py` — DM/staff-only, incl. hidden, `X-Skip-Cache: true`, mirrors
  `game_possession_detail_full.py`.
- `game_common_item_photo_upload.py` — mirrors `game_possession_photo_upload.py` exactly
  (`UploadInitiator`, fixed deterministic path `games/<slug>/common_items/<id>/photo<ext>`,
  reuse-or-create the single photo).

`backend/games/views/permissions/game_common_item_permissions.py` — entity-agnostic
`GET /permissions/game_common_item.json`, mirrors `game_possession_permissions.py`.

### Step 5 — URLs

`backend/games/urls/games.py` — add the 5 `common_items` routes in the same block style as the
existing `possessions` routes (see [plan.md](plan.md) for exact paths/names).

`backend/games/urls/permissions.py` — add the `permissions/game_common_item.json` route,
mirroring the `game_possession` entry.

### Step 6 — Tests

Mirror the possession test suite 1:1, dropping anything possession-only has for its
character-owned variant (there is none here — `GameCommonItem` has no PC/NPC acquire/remove
equivalent):
- `backend/games/tests/factories/common_item.py` — `GameCommonItemFactory`, mirroring
  `GamePossessionFactory` (add a `price` default, e.g. `10`).
- `backend/games/tests/models/game/game_common_item_test.py` (+ `_photo_test.py`)
- `backend/games/tests/serializers/games/common_items/` — list/detail/update serializer tests
- `backend/games/tests/views/games/` — `game_common_items_test.py`,
  `game_common_items_all_test.py`, `game_common_item_detail_test.py`,
  `game_common_item_detail_full_test.py`, `game_common_item_photo_upload_test.py`
- `backend/games/tests/views/permissions/game_common_item_permissions_test.py`

## Files to Change

- `backend/games/models/game/game_common_item.py` — new model
- `backend/games/models/game/game_common_item_photo.py` — new model
- `backend/games/models/__init__.py` — export new models
- `backend/games/migrations/` — new migration(s) for the two models
- `backend/versioning/migrations/` — new migration for `HistoricalGameCommonItem`
- `backend/games/serializers/games/common_items/*.py` — new serializer package
- `backend/games/serializers/__init__.py` — export new serializers
- `backend/permissions/config/game_common_item/endpoints.yml` — new
- `backend/permissions/config/game_common_item/ui.yml` — new
- `backend/games/views/games/game_common_items.py`,
  `_common_item_create.py`, `game_common_items_all.py`, `game_common_item_detail.py`,
  `game_common_item_detail_full.py`, `game_common_item_photo_upload.py` — new views
- `backend/games/views/permissions/game_common_item_permissions.py` — new view
- `backend/games/urls/games.py`, `backend/games/urls/permissions.py` — new routes
- `backend/games/tests/**` — new test files listed in Step 6

## CI Checks

- `backend`: `poetry run pytest` (CI jobs `pytest_views_rest`/`pytest_all` — new views/models
  land under `backend/games/tests/views`/`backend/games/tests/models`, matching those jobs' scope)
- `backend`: `poetry run ruff check .` (CI job `checks`)
- `backend`: `bin/reports.sh ci` (CI job `checks`, complexity check)

## Notes

- No character-owned `CharacterCommonItem` — confirmed out of scope by the issue.
- No delete endpoint — matches the established pattern (`GameItem`/`GamePossession`/`Document`
  have none either); `hidden` is the only "remove from view" mechanism.
- `price` has no default and is required on create, since a priced catalog entry without a price
  is meaningless — matches `Treasure.value`'s required-field convention.
