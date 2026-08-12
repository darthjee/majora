# Backend Plan: Add factions

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the endpoints, payload shapes, and i18n key list documented in [plan.md](plan.md)'s
"Shared contracts" section — including the create/photo_upload-vs-update permission split
flagged there. Templates: `backend/games/models/game/game_item.py` /
`game_item_photo.py`, `backend/games/serializers/games/items/*.py`,
`backend/games/views/games/game_item*.py` + `_item_create.py`, and
`backend/games/urls/games.py`'s `items` block — mirror these, dropping everything hidden/
`_all`/`_full`-related (no hidden concept for Faction) and everything PC/NPC/`CharacterItem`-
related (no acquisition — Faction↔Character is a plain M2M, not an owned/acquired resource).

## Implementation Steps

### Step 1 — Models

Create `Faction` and `FactionPhoto` under a new `backend/games/models/faction/` folder,
mirroring `backend/games/models/game/game_item.py`/`game_item_photo.py` but simpler (no
`hidden`, no `description`):

```python
# backend/games/models/faction/faction.py
class Faction(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='factions')
    name = models.CharField(max_length=200)
    photo = models.ForeignKey(
        'games.FactionPhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+',
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(fields=['game', 'name'], name='unique_faction_name_per_game'),
        ]
```

```python
# backend/games/models/faction/faction_photo.py
class FactionPhoto(BasePhoto):
    faction = models.ForeignKey(Faction, on_delete=models.CASCADE, related_name='photos')
```

Register both in `backend/games/models/__init__.py` (import + `__all__`), alphabetically
alongside the existing `GameItem`/`GameDocument`/`Faction`-adjacent entries.

Add the M2M field to `Character` (`backend/games/models/character/character.py`), right after
the existing `photo` field (line 51) and before `history = HistoricalRecords(...)` (line 52):

```python
factions = models.ManyToManyField('games.Faction', related_name='characters', blank=True)
```

Generate the migration(s) (`python manage.py makemigrations games`) — next number after `0091`,
i.e. starting at `0092`. This may produce one migration (new models + M2M field together) or
two, depending on how Django batches the changes — either is fine.

### Step 2 — Serializers

New folder `backend/games/serializers/games/factions/`, mirroring
`backend/games/serializers/games/items/` but collapsed to a single flat shape (no
list-vs-detail split, since there's no extra field detail exposes beyond the list):

- `faction_list.py` — `FactionListSerializer` (`id`, `name`, `photo_path` via
  `source='photo.path'`). Reuse this same serializer for list items, the create response, the
  detail response, and the update response — do **not** add a separate
  `FactionDetailSerializer` unless a genuine field-set difference emerges (there isn't one here).
- `faction_update.py` — `FactionUpdateSerializer` (`name`, `required: False` for PATCH partial
  semantics)
- `faction_photo.py` — `FactionPhotoSerializer` (`id`, `path`) — kept for consistency with
  `GameItemPhotoSerializer`/`GamePossessionPhotoSerializer` even though nothing currently
  consumes it directly either

Register every new serializer in `backend/games/serializers/__init__.py` (import + `__all__`),
alphabetically alongside the existing `GameItem*`/`GameDocument*` entries.

### Step 3 — Permissions config

`backend/permissions/config/game_faction/endpoints.yml`, identical shape to
`backend/permissions/config/game_item/endpoints.yml` (confirmed exact content during planning):

```yaml
regular:
  create:
    - staff
    - player
  photo_upload:
    - staff
    - player
```

Update (PATCH) is **not** listed here — per [plan.md](plan.md)'s "Shared contracts" note, it goes
through the shared `check_game_edit` helper (`backend/games/views/common.py:24-32`), same as
`GameItem`'s own update path, not a `game_faction`-specific config entry.

### Step 4 — Views

New files under `backend/games/views/games/`, mirroring the `game_item*`/`_item_create` files
(dropping the `_all`/`_full` hidden-inclusive variants — no hidden concept here):

- `_faction_create.py` — `faction_create(request, game)`: validates `{name}` via an inline
  `_FactionCreateSerializer`, checks `EndpointPermission(request.user, game=game).check(request,
  'game_faction', 'regular', 'create')`, creates the `Faction`, returns `FactionListSerializer`
  data with status 201 (mirrors `_item_create.py`)
- `game_factions.py` — `game_factions(request, game_slug)`: `GET`/`POST` combined, `GET` returns
  the paginated list (open — no permission check beyond game access), `POST` delegates to
  `faction_create` (mirrors `game_items.py`, minus the `_all` branch)
- `game_faction_detail.py` — `game_faction_detail(request, game_slug, faction_id)`:
  `GET`/`PATCH` combined. `GET` returns the detail shape, open to any game participant. `PATCH`
  calls `check_game_edit(request, game)` (DM/staff only — see permissions note in
  [plan.md](plan.md)), validates via `FactionUpdateSerializer`, saves, returns the detail shape
  (mirrors `game_item_detail.py`'s update branch, but note the permission check itself is the
  *only* branch here — there's no `_full` hidden-inclusive variant to also implement)
- `game_faction_photo_upload.py` — `game_faction_photo_upload(request, game_slug, faction_id)`:
  same `UploadInitiator`/`PhotoPathBuilder` flow as `game_item_photo_upload.py`, checks
  `EndpointPermission(...).check(request, 'game_faction', 'regular', 'photo_upload')`, fixed
  deterministic path `games/<slug>/factions/<id>/photo<ext>` (`use_uuid=False`, always
  replaces), reusing or creating the `FactionPhoto` the same way `_reuse_or_create_photo` does
  for items

Register all four in `backend/games/views/games/__init__.py` (import + `__all__`).

### Step 5 — URLs

Add to `backend/games/urls/games.py`, alongside the existing `items` block:

```python
path('games/<slug:game_slug>/factions.json', views.game_factions, name='game-factions'),
path('games/<slug:game_slug>/factions/<int:faction_id>.json', views.game_faction_detail, name='game-faction-detail'),
path('games/<slug:game_slug>/factions/<int:faction_id>/photo_upload.json', views.game_faction_photo_upload, name='game-faction-photo-upload'),
```

### Step 6 — Factory and tests

- `backend/games/tests/factories/faction.py` — `FactionFactory` (mirrors `GameItemFactory` from
  `backend/games/tests/factories/item.py`, dropping the character-ownership pieces)
- Model tests: `backend/games/tests/models/faction/faction_test.py`,
  `faction_photo_test.py` (mirror `game_item_test.py`/`game_item_photo_test.py`); also add a
  `Character.factions` M2M assertion to the existing `character_test.py`
- Serializer tests: `backend/games/tests/serializers/games/factions/{faction_list,
  faction_update}_test.py` (mirror the equivalent `items/` test files)
- View tests: `backend/games/tests/views/games/{game_factions, game_faction_detail,
  game_faction_photo_upload}_test.py` (mirror the equivalent `game_item*_test.py` files) —
  cover both the `regular`-tier (create/photo_upload, staff+player) and `check_game_edit`
  (update, DM/staff-only) permission paths explicitly, since they differ

## Files to Change

- `backend/games/models/faction/faction.py` — new
- `backend/games/models/faction/faction_photo.py` — new
- `backend/games/models/character/character.py` — add `factions` M2M field
- `backend/games/models/__init__.py` — register new models
- `backend/games/migrations/00XX_*.py` — new migration(s)
- `backend/games/serializers/games/factions/faction_list.py` — new
- `backend/games/serializers/games/factions/faction_update.py` — new
- `backend/games/serializers/games/factions/faction_photo.py` — new
- `backend/games/serializers/__init__.py` — register new serializers
- `backend/permissions/config/game_faction/endpoints.yml` — new
- `backend/games/views/games/_faction_create.py` — new
- `backend/games/views/games/game_factions.py` — new
- `backend/games/views/games/game_faction_detail.py` — new
- `backend/games/views/games/game_faction_photo_upload.py` — new
- `backend/games/views/games/__init__.py` — register new views
- `backend/games/urls/games.py` — add `factions` routes
- `backend/games/tests/factories/faction.py` — new
- `backend/games/tests/models/faction/faction_test.py` — new
- `backend/games/tests/models/faction/faction_photo_test.py` — new
- `backend/games/tests/models/character/character_test.py` — add `factions` M2M assertion
- `backend/games/tests/serializers/games/factions/*_test.py` — new (2 files)
- `backend/games/tests/views/games/game_faction*_test.py` — new (3 files)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — model
  and serializer tests
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — the new `games/tests/views/games/game_faction*_test.py` files
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Double-check the permissions split flagged in [plan.md](plan.md) before implementing: create
  and photo-upload are `regular` (staff+player), but update is DM/staff-only via
  `check_game_edit` — this is a correction to what the issue text currently says ("matching
  Items" for all three). Worth confirming with the user if the product intent was actually
  "any player can rename a faction" rather than DM-only, since that would mean *not* mirroring
  `GameItem` here and instead using the `regular` tier for update too (which would need its own
  `EndpointPermission` category rather than `check_game_edit`).
- No PC/NPC routes, no `CharacterFaction` model — `Character.factions` is a plain M2M with no
  through-model needed (no per-assignment metadata was requested).
