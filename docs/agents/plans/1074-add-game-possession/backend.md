# Backend Plan: Add Game Possession

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the endpoints, payload shapes, and i18n key list documented in [plan.md](plan.md)'s
"Shared contracts" section. Consult `backend/games/models/game/game_item.py`,
`backend/games/serializers/games/items/*.py`, `backend/games/views/games/game_item*.py`,
`backend/games/views/games/_item_create.py`, and `backend/games/urls/games.py`'s `items` block
as the exact templates — this plan mirrors them field-for-field, minus everything
acquisition/`CharacterItem`-related (out of scope, tracked in #1076).

## Implementation Steps

### Step 1 — Models

Create `GamePossession` and `GamePossessionPhoto`, mirroring `GameItem`/`GameItemPhoto` exactly
(see `backend/games/models/game/game_item.py` and `game_item_photo.py`):

```python
# backend/games/models/game/game_possession.py
class GamePossession(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='possessions')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    photo = models.ForeignKey(
        'games.GamePossessionPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        ordering = ['id']
```

```python
# backend/games/models/game/game_possession_photo.py
class GamePossessionPhoto(BasePhoto):
    game_possession = models.ForeignKey(GamePossession, on_delete=models.CASCADE, related_name='photos')
```

Register both in `backend/games/models/__init__.py` (import + `__all__`), then generate the
migration (`python manage.py makemigrations games`) — next migration number after `0091`.

### Step 2 — Serializers

New folder `backend/games/serializers/games/possessions/`, mirroring
`backend/games/serializers/games/items/`:

- `game_possession_list.py` — `GamePossessionListSerializer` (`id`, `name`, `photo_path` via
  `source='photo.path'`), `GamePossessionAllListSerializer` (`+ hidden`, via `HiddenFieldMixin`)
- `game_possession_update.py` — `GamePossessionUpdateSerializer` (`name`, `description`,
  `hidden`, all `required: False`)
- `game_possession_photo.py` — `GamePossessionPhotoSerializer` (`id`, `path`) — kept for
  consistency with `GameItemPhotoSerializer` even though nothing currently consumes it directly
  either

Add `GamePossessionDetailSerializer` (`GamePossessionListSerializer` + `description`) and
`GamePossessionDetailFullSerializer` (`GamePossessionDetailSerializer` + `hidden`, via
`HiddenFieldMixin`) alongside the list serializers, same as `game_item_list.py` does for items.

Register every new serializer in `backend/games/serializers/__init__.py` (import + `__all__`),
alphabetically alongside the existing `GameItem*`/`GameDocument*` entries.

### Step 3 — Permissions config

`backend/permissions/config/game_possession/endpoints.yml`, identical shape to
`backend/permissions/config/game_item/endpoints.yml`:

```yaml
regular:
  create:
    - staff
    - player
  photo_upload:
    - staff
    - player
```

### Step 4 — Views

New files under `backend/games/views/games/`, mirroring the `game_item*`/`_item_create` files:

- `_possession_create.py` — `game_possession_create(request, game)`: validates
  `{name, description?, hidden?}` via an inline `_GamePossessionCreateSerializer`, checks
  `EndpointPermission(...).check(request, 'game_possession', 'regular', 'create')`, creates the
  `GamePossession`, returns `GamePossessionDetailFullSerializer` data with status 201 (mirrors
  `_item_create.py`)
- `game_possessions.py` — `game_possessions(request, game_slug)`: `GET`/`POST` combined,
  `GET` returns the paginated non-hidden list, `POST` delegates to `game_possession_create`
  (mirrors `game_items.py`)
- `game_possessions_all.py` — `game_possessions_all(request, game_slug)`: DM/staff-only
  hidden-inclusive paginated list, `X-Skip-Cache: true` (mirrors `game_items_all.py`)
- `game_possession_detail.py` — `game_possession_detail(request, game_slug, possession_id)`:
  `GET`/`PATCH` combined, `GET` returns non-hidden detail (404 if hidden), `PATCH` checks
  `check_game_edit`, validates via `GamePossessionUpdateSerializer`, saves, returns full-detail
  shape (mirrors `game_item_detail.py`)
- `game_possession_detail_full.py` — `game_possession_detail_full(request, game_slug,
  possession_id)`: DM/staff-only hidden-inclusive detail, `X-Skip-Cache: true` (mirrors
  `game_item_detail_full.py`)
- `game_possession_photo_upload.py` — `game_possession_photo_upload(request, game_slug,
  possession_id)`: same `UploadInitiator`/`PhotoPathBuilder` flow as `game_item_photo_upload.py`,
  fixed deterministic path `games/<slug>/possessions/<id>/photo<ext>` (`use_uuid=False`, always
  replaces), reusing or creating the `GamePossessionPhoto` the same way
  `_reuse_or_create_photo` does for items

Register all five in `backend/games/views/games/__init__.py` (import + `__all__`).

### Step 5 — URLs

Add to `backend/games/urls/games.py`, alongside the existing `items` block (same path shape,
`possession_id` instead of `item_id`, no pc/npc-summary routes):

```python
path('games/<slug:game_slug>/possessions.json', views.game_possessions, name='game-possessions'),
path('games/<slug:game_slug>/possessions/all.json', views.game_possessions_all, name='game-possessions-all'),
path('games/<slug:game_slug>/possessions/<int:possession_id>.json', views.game_possession_detail, name='game-possession-detail'),
path('games/<slug:game_slug>/possessions/<int:possession_id>/full.json', views.game_possession_detail_full, name='game-possession-detail-full'),
path('games/<slug:game_slug>/possessions/<int:possession_id>/photo_upload.json', views.game_possession_photo_upload, name='game-possession-photo-upload'),
```

### Step 6 — Factory and tests

- `backend/games/tests/factories/possession.py` — `GamePossessionFactory` only (no
  `CharacterPossessionFactory`; mirrors `GameItemFactory` from
  `backend/games/tests/factories/item.py`, dropping `CharacterItemFactory`)
- Model tests: `backend/games/tests/models/game/game_possession_test.py`,
  `game_possession_photo_test.py` (mirror `game_item_test.py`/`game_item_photo_test.py`)
- Serializer tests: `backend/games/tests/serializers/games/possessions/{game_possession_list,
  game_possession_detail, game_possession_update}_test.py` (mirror the equivalent `items/`
  test files)
- View tests: `backend/games/tests/views/games/{game_possessions, game_possessions_all,
  game_possession_detail, game_possession_detail_full, game_possession_photo_upload}_test.py`
  (mirror the equivalent `game_item*_test.py` files)

## Files to Change

- `backend/games/models/game/game_possession.py` — new
- `backend/games/models/game/game_possession_photo.py` — new
- `backend/games/models/__init__.py` — register new models
- `backend/games/migrations/00XX_gamepossession_*.py` — new migration
- `backend/games/serializers/games/possessions/game_possession_list.py` — new
- `backend/games/serializers/games/possessions/game_possession_update.py` — new
- `backend/games/serializers/games/possessions/game_possession_photo.py` — new
- `backend/games/serializers/__init__.py` — register new serializers
- `backend/permissions/config/game_possession/endpoints.yml` — new
- `backend/games/views/games/_possession_create.py` — new
- `backend/games/views/games/game_possessions.py` — new
- `backend/games/views/games/game_possessions_all.py` — new
- `backend/games/views/games/game_possession_detail.py` — new
- `backend/games/views/games/game_possession_detail_full.py` — new
- `backend/games/views/games/game_possession_photo_upload.py` — new
- `backend/games/views/games/__init__.py` — register new views
- `backend/games/urls/games.py` — add `possessions` routes
- `backend/games/tests/factories/possession.py` — new
- `backend/games/tests/models/game/game_possession_test.py` — new
- `backend/games/tests/models/game/game_possession_photo_test.py` — new
- `backend/games/tests/serializers/games/possessions/*_test.py` — new (3 files)
- `backend/games/tests/views/games/game_possession*_test.py` — new (5 files)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — model
  and serializer tests
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — the new `games/tests/views/games/game_possession*_test.py` files
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- `game_possession_id` route kwarg is named `possession_id` (not `item_id`) purely for
  readability — no functional difference.
- No PC/NPC routes, no `Character*` model, no acquire/remove/summary endpoints — all deferred to
  #1076.
