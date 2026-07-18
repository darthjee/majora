# Backend Plan: Add item list

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the six endpoints and response shapes listed in [plan.md](plan.md)'s "Shared
contracts" section. In particular: `CharacterItem`'s `name`/`description`/`photo_path` must
be resolved server-side (null → the linked `GameItem`'s value) before serialization; `hidden`
is a plain field on `CharacterItem`/`GameItem` (never inherited, never resolved) and only
appears in the `/all.json` serializers.

## Implementation Steps

### Step 1 — Models

Following [models-organization.md](../../models-organization.md), add (no `Item`/registry
model — `GameItem` is the top of the hierarchy):

- `backend/games/models/game/game_item.py` — `GameItem`: `game` (FK → `Game`, `CASCADE`),
  `name` (CharField), `description` (TextField), `photo` (FK → `GameItemPhoto`, null/blank,
  `SET_NULL`), `hidden` (BooleanField, default `False`). `history = HistoricalRecords(app='versioning')`,
  mirroring `Treasure`/`CharacterTreasure`'s history tracking (`GameTreasure` is the one
  precedent intentionally excluded — `GameItem` should track history since, unlike
  `GameTreasure`, it holds the item's own name/description/photo, not just a per-game link).
- `backend/games/models/character/character_item.py` — `CharacterItem`: `character` (FK →
  `Character`, `CASCADE`), `game_item` (FK → `GameItem`, `CASCADE`), `name` (CharField,
  null/blank), `description` (TextField, null/blank), `photo` (FK → `CharacterItemPhoto`,
  null/blank, `SET_NULL`), `hidden` (BooleanField, default `False`). `unique_together =
  ('character', 'game_item')`. `history = HistoricalRecords(app='versioning')`.
- `backend/games/models/game/game_item_photo.py` — `GameItemPhoto`, mirroring
  `TreasurePhoto` (`path`, `ready`, `history`).
- `backend/games/models/character/character_item_photo.py` — `CharacterItemPhoto`, same
  shape as `GameItemPhoto`.
- Register all four in `games/models/__init__.py` (or wherever `Treasure`/`GameTreasure` are
  currently exported) and in `versioning`'s tracked-model list
  (`docs/agents/architecture.md`'s "Cross-cutting change-history infrastructure" section —
  update that doc's model list too).
- `backend/games/admin.py` — register the two new models (and their `Historical*` read-only
  variants, per the existing `versioning` convention).
- Run `docker-compose run --rm majora_tests python manage.py makemigrations` inside
  `backend/` to generate the migration(s); `GameItemPhoto`/`CharacterItemPhoto`'s history
  tables route into `versioning/migrations/` automatically via `HistoricalRecords(app='versioning')`.

### Step 2 — Fallback resolution helper

Add `backend/games/serializers/games/items/character_item_fields.py` (new `items/` folder
under `serializers/games/`, mirroring `serializers/games/treasures/`), with a
`resolve_character_item_field(character_item, field)`-style helper (or one function per
field) that returns `getattr(character_item, field)` if not `None`, else
`getattr(character_item.game_item, field)`. This is simpler than
`game_treasure_fields.py`'s context-lookup pattern since the fallback source
(`character_item.game_item`) is a direct FK, not something resolved via a separate link table
+ context game.

### Step 3 — Serializers

Following [serializers-organization.md](../../serializers-organization.md):

- `backend/games/serializers/games/items/game_item_list.py` — `GameItemListSerializer`
  (`id`, `name`, `description`, `photo_path`) and `GameItemAllListSerializer` (+ `hidden`),
  mirroring `serializers/treasures/treasure_list.py`.
- `backend/games/serializers/characters/character_item.py` —
  `CharacterItemSerializer` (`id`, `game_item_id`, `name`/`description`/`photo_path` via the
  Step 2 fallback helper) and `CharacterItemAllSerializer` (+ `hidden`), mirroring
  `serializers/characters/character_treasure.py`.

### Step 4 — Views

Following [views-organization.md](../../views-organization.md):

- `backend/games/views/games/game_items.py` / `game_items_all.py` — list `GameItem` for a
  game; `game_items` excludes `hidden=True` and is `AllowAny`; `game_items_all` requires
  `GameEditPermission.check()` (dm/admin — same permission class `game_treasures_all` uses).
- `backend/games/views/game/_items.py` — shared `character_items(request, game,
  character_id, npc, check_hidden, allow_hidden=False, serializer_class=...)` helper,
  mirroring `views/game/_treasures.py::character_treasures` (hidden-character gate via
  `check_hidden`, hidden-item filtering via `allow_hidden`, `select_related('game_item')`
  instead of `select_related('treasure')`, no value/quantity filtering or annotation needed
  since `CharacterItem` has no `value`/`quantity` fields).
- `backend/games/views/game/pcs/detail/items/game_pc_items.py` /
  `game_pc_items_all.py` — PC endpoints. `game_pc_items_all` is a genuinely new permission
  shape vs. Treasure (Treasure has no `/pcs/:id/treasures/all.json` at all) — gate with
  `GameEditPermission` (which already covers owner via `Character.can_be_edited_by_roles`,
  same as `PcTreasureEditPermission`/whatever PC-owner-aware permission class the codebase
  uses elsewhere — check `permissions.py` for the exact PC-owner-including class name before
  wiring this up).
- `backend/games/views/game/npcs/detail/items/game_npc_items.py` /
  `game_npc_items_all.py` — NPC endpoints, mirroring `game_npc_treasures.py` /
  `game_npc_treasures_all.py` exactly (dm/admin only, `check_hidden=True`).

### Step 5 — URLs

Add to `backend/games/urls/games.py` (`games/:game_slug/items.json`,
`games/:game_slug/items/all.json`), `backend/games/urls/pcs.py`
(`.../pcs/:character_id/items.json`, `.../items/all.json`), and
`backend/games/urls/npcs.py` (same for npcs), following the existing treasure route naming
(`name='game-items'`, `name='game-items-all'`, etc.).

### Step 6 — Tests

Add unit/integration tests mirroring the existing treasure test tree (models, serializers,
views) — see [contributing.md](../../contributing.md) for the mirrored `tests/` layout
convention. Cover: fallback resolution (null vs. overridden `CharacterItem` fields), hidden
filtering per endpoint/role, and the `unique_together` constraint.

### Step 7 — Docs

- [access-control.md](../../access-control.md): add `access-control/game-item.md` and
  `access-control/character-item.md` (mirroring `game-treasure.md`/`character-treasure.md`),
  and add both to the "Contents" index.
- [product.md](../../product.md): add `GameItem`/`CharacterItem` entity definitions if that
  doc enumerates entities (check current structure — mirror however `Treasure` is described
  there).

## Files to Change

- `backend/games/models/game/game_item.py` (new)
- `backend/games/models/game/game_item_photo.py` (new)
- `backend/games/models/character/character_item.py` (new)
- `backend/games/models/character/character_item_photo.py` (new)
- `backend/games/models/__init__.py`
- `backend/games/admin.py`
- `backend/games/migrations/` (new migration)
- `backend/versioning/migrations/` (new migration for the history tables)
- `backend/games/serializers/games/items/character_item_fields.py` (new)
- `backend/games/serializers/games/items/game_item_list.py` (new)
- `backend/games/serializers/characters/character_item.py` (new)
- `backend/games/serializers/__init__.py` (export new serializers)
- `backend/games/views/games/game_items.py`, `game_items_all.py` (new)
- `backend/games/views/game/_items.py` (new)
- `backend/games/views/game/pcs/detail/items/game_pc_items.py`, `game_pc_items_all.py` (new)
- `backend/games/views/game/npcs/detail/items/game_npc_items.py`, `game_npc_items_all.py` (new)
- `backend/games/urls/games.py`, `urls/pcs.py`, `urls/npcs.py`
- `docs/agents/access-control/game-item.md`, `character-item.md` (new)
- `docs/agents/access-control.md`
- `docs/agents/architecture.md` (versioning tracked-model list)
- Mirrored test files under `backend/games/tests/`

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`,
  `pytest_views_rest`, `pytest_all`)
- `backend/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- Double-check `permissions.py` for the exact permission class that already grants PC owners
  edit access (used by PC treasure endpoints or the PC detail endpoint) before wiring
  `game_pc_items_all` — the plan assumes `GameEditPermission`-style role checking covers
  owner via `Character.can_be_edited_by_roles`, but confirm the precise class name in code.
- `GameItem`/`CharacterItem` deliberately carry no `value`/`quantity`/stock fields (unlike
  `Treasure`/`GameTreasure`/`CharacterTreasure`) — the shared `_items.py` view helper should
  stay simpler than `_treasures.py` and not port over the value-annotation/filter logic.
- Photo upload endpoints for `GameItemPhoto`/`CharacterItemPhoto` are explicitly out of scope
  for this issue (see issue's "Out of scope"); the FK fields exist on the models now so a
  later issue can add upload without a further migration to add the relationship itself.
