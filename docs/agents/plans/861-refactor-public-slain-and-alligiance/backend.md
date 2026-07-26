# Backend Plan: Refactor public slain and allegiance

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Character field & endpoint contract" — this file is the source of truth you must produce. The frontend agent builds against exactly the response/write-payload keys and filter query params documented there; do not deviate from those names without a good reason.

## Implementation Steps

### Step 1 — Model rename + migration

In `backend/games/models/character/character.py`, rename the `slain` field to `private_slain` and `allegiance` to `private_allegiance` (keep `public_slain`/`public_allegiance` untouched).

Generate the migration (`docker-compose run --rm majora_tests python manage.py makemigrations`, or equivalent) so it uses `migrations.RenameField` for both columns — reversible and data-preserving by construction. Confirm Django detects a rename rather than an add+drop when prompted (it should, since only the field name changes).

### Step 2 — Public read serializers: drop the alias

- `backend/games/serializers/characters/character_list.py`: remove the `slain = serializers.BooleanField(source='public_slain', ...)` and `allegiance = serializers.CharField(source='public_allegiance', ...)` declarations; list `public_slain`, `public_allegiance` directly in `Meta.fields` instead of `slain`, `allegiance`.
- `backend/games/serializers/characters/character_detail.py`: same change.

### Step 3 — Private/full serializers: expose both pairs under their real names

- `backend/games/serializers/characters/character_full.py` (`CharacterFullSerializer`, extends `CharacterDetailSerializer`): it currently redeclares `allegiance`/`slain` as unaliased real fields to undo the base class's aliasing, and adds `public_allegiance`/`public_slain`. After Step 2, the base class no longer aliases anything, so drop those now-redundant redeclarations; instead declare/expose `private_slain`, `private_allegiance` (the base already provides `public_slain`/`public_allegiance` plainly) and add them to `Meta.fields` alongside the existing `private_description`, `hidden`.
- `backend/games/serializers/characters/character_full_list.py` (`CharacterFullListSerializer`, extends `CharacterListSerializer`): same shape — drop the redundant `allegiance`/`slain` redeclarations, expose `private_slain`/`private_allegiance` instead, added to `Meta.fields`.

### Step 4 — Write serializers: rename fields, remove the public-patch alias

- `backend/games/serializers/characters/npcs/npc_player_update.py` (`NpcPlayerUpdateSerializer`): remove the `allegiance = serializers.ChoiceField(source='public_allegiance', ...)` / `slain = serializers.BooleanField(source='public_slain', ...)` aliasing entirely. List `public_allegiance`, `public_slain` directly (as real model field names, no `source=`) in `Meta.fields`, replacing `allegiance`, `slain`. This is a wire-format change: the payload key becomes `public_allegiance`/`public_slain` instead of `allegiance`/`slain`.
- `backend/games/serializers/characters/character_update.py` (`CharacterUpdateSerializer`, used for both PC's and NPC's `full.json` PATCH): rename `'allegiance'` → `'private_allegiance'` and `'slain'` → `'private_slain'` in `Meta.fields` (and `extra_kwargs`, which iterates `fields`, needs no separate change since it derives from the list).
- `backend/games/serializers/characters/character_create.py` (`CharacterCreateSerializer`, NPC creation): rename `'allegiance'` → `'private_allegiance'` in `Meta.fields` and `extra_kwargs`.

### Step 5 — NPC index filters: independent public/private params

`backend/games/views/game/_shared.py`'s `_filter_by_slain`/`_filter_by_allegiance`/`_filter_characters` currently take a single `slain_field`/`allegiance_field` but always read the query param under the fixed name `'slain'`/`'allegiance'` — used today to make the *public* index read the `public_slain`/`public_allegiance` columns via the plain `slain`/`allegiance` query params, and the DM `all.json` index read the real columns via those same param names.

Per the contract, the public index must now read query params named `public_slain`/`public_allegiance` (filtering the identically-named columns — no more indirection needed there), while the DM `all.json` index must support **both** pairs of query params (`public_slain`+`private_slain`, `public_allegiance`+`private_allegiance`) simultaneously, each filtering its own column. Rework `_filter_by_slain`/`_filter_by_allegiance` so the query-param name always matches the field being filtered (drop the fixed `'slain'`/`'allegiance'` param-name assumption), and have `_filter_characters` (or a DM-specific variant) apply both slain filters and both allegiance filters when called from `game_npcs_all.py`. Update the two call sites:
- `backend/games/views/game/npcs/game_npcs.py` (public index): filter by `public_slain`, `public_allegiance` only.
- `backend/games/views/game/npcs/game_npcs_all.py` (DM/admin index): filter by all four params.

### Step 6 — Update backend tests

Rename `slain`/`allegiance` references (model kwargs, expected response keys, PATCH payload keys, filter query params) across the mirrored test tree — serializers, views (`games/tests/views/game/npcs/`, `games/tests/views/game/pcs/`), and any model tests. Grep for `slain`/`allegiance` under `backend/games/tests/` as a checklist (currently ~12 files reference them).

## Files to Change

- `backend/games/models/character/character.py` — rename `slain`→`private_slain`, `allegiance`→`private_allegiance`.
- `backend/games/migrations/00XX_rename_slain_and_allegiance_to_private.py` — new `RenameField` migration (generated, name may differ).
- `backend/games/serializers/characters/character_list.py`, `character_detail.py` — drop alias, expose `public_slain`/`public_allegiance` directly.
- `backend/games/serializers/characters/character_full.py`, `character_full_list.py` — expose `private_slain`/`private_allegiance` alongside the public pair.
- `backend/games/serializers/characters/npcs/npc_player_update.py` — public patch now writes `public_slain`/`public_allegiance` directly (wire key rename).
- `backend/games/serializers/characters/character_update.py`, `character_create.py` — rename `allegiance`/`slain` fields to `private_allegiance`/`private_slain`.
- `backend/games/views/game/_shared.py` — filter helpers keyed by matching param/field name, supporting both public and private filters.
- `backend/games/views/game/npcs/game_npcs.py`, `game_npcs_all.py` — updated filter call sites.
- Mirrored files under `backend/games/tests/` for every file above.

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
- `backend/`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`, covers serializer/model tests)
- `backend/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `CharacterUpdateSerializer` backs both the PC's and the NPC's `full.json` PATCH (`backend/games/views/game/_character_shared.py`'s `build_full_view` → `_full.py` → `character_full`), so its field rename affects both PC and NPC private editing even though the frontend never renders allegiance/slain UI for PCs.
- Keep permissions/route access unchanged per the issue's explicit "What this issue is not about" — this is a pure rename + de-transformation, not a permissions change.
