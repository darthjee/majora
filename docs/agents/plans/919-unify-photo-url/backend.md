# Backend Plan: Unify photo url

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the API response rename described in the main plan:
- `Game.cover_photo_path` -> `photo_path`
- `Character.profile_photo_path` -> `photo_path`, `Character.profile_photo_id` -> `photo_id`

No request/write payload changes — photo upload (`upload_finalize.py`), photo role-set (`_photo_set.py`), and photo detail/delete (`_photo_detail.py`) keep their existing shapes; only the internal attribute names they touch change.

## Implementation Steps

### Step 1 — Rename the `Game.cover_photo` relationship

In `games/models/game/game.py`, rename the `cover_photo` field to `photo` (keep `related_name='+'`, `null=True`, `on_delete`, etc. unchanged — only the attribute name changes).

Generate a migration with `poetry run python manage.py makemigrations games` from inside `backend/`; confirm Django detects it as a field rename (`RenameField`) so the DB column goes from `cover_photo_id` to `photo_id` without a data migration. Review the generated migration file before committing.

### Step 2 — Rename the `Character.profile_photo` relationship

Same as Step 1, in `games/models/character/character.py`: rename `profile_photo` -> `photo`. Include in the same `makemigrations` run (or a second migration) so `profile_photo_id` -> `photo_id`.

### Step 3 — Update the Game serializers

- `games/serializers/games/game_detail.py` and `games/serializers/games/game_list.py`: rename the `cover_photo_path` field to `photo_path`, updating its `source` from `cover_photo.path` to `photo.path`.

### Step 4 — Update the Character serializers and the shared incognito helper

- `games/serializers/characters/_profile_photo_path.py`: rename to `_photo_path.py`, rename `resolve_profile_photo_path` to `resolve_photo_path`, and update its body to read `character.photo` instead of `character.profile_photo`. Keep the incognito-hides-photo behavior exactly as-is — only names change.
- `games/serializers/characters/character_detail.py`, `character_list.py`, `character_full.py`, `character_full_list.py`: rename the `profile_photo_path` field to `photo_path` (update the `get_profile_photo_path` method name to `get_photo_path` where used as a `SerializerMethodField`, and the import/call of the renamed helper). Rename `profile_photo_id` to `photo_id` (update `source='profile_photo.id'` to `source='photo.id'`) wherever present (at least `character_detail.py`).
- `games/serializers/games/players/player_character.py`: rename its `profile_photo_path` field (`source='profile_photo.path'`) to `photo_path` (`source='photo.path'`).

### Step 5 — Update the views that set/clear the relationship

- `games/views/upload_finalize.py`: update `_set_cover_photo_if_unset`/`_set_profile_photo_if_unset` (and the `game.cover_photo_id`/`game.cover_photo` and `character.profile_photo_id`/`character.profile_photo` references) to use `game.photo`/`character.photo`. Renaming the helper functions themselves is optional but preferred for consistency.
- `games/views/game/_photo_set.py`: update `character.profile_photo = photo` to `character.photo = photo`.
- `games/views/game/_photo_detail.py`: update `character.profile_photo_id`/`character.profile_photo` to `character.photo_id`/`character.photo`.

### Step 6 — Update tests and factories

Update every reference found via `grep -rln "profile_photo\|cover_photo" games/tests` (model tests, serializer tests, and the view tests under `games/tests/views/games/`, `games/tests/views/game/pcs/`, `games/tests/views/game/npcs/`, plus `games/tests/permissions/builder_test.py` and `games/tests/views/upload_finalize_test.py`) to use the renamed attribute/field names. Do not change test intent — only the names being asserted/set.

### Step 7 — Full-repo sanity sweep

Re-run `grep -rn "cover_photo\|profile_photo" backend/` (excluding old migration files under `games/migrations/0026_*`, `0027_*`, `0028_*`, and `versioning/migrations/0001_initial.py`, which are historical and must stay as-is) to confirm nothing was missed.

## Files to Change

- `games/models/game/game.py` — rename `cover_photo` -> `photo`
- `games/models/character/character.py` — rename `profile_photo` -> `photo`
- `games/migrations/<new>.py` — generated rename migration(s)
- `games/serializers/games/game_detail.py`, `game_list.py` — `photo_path` field
- `games/serializers/characters/_profile_photo_path.py` -> `_photo_path.py` — renamed helper
- `games/serializers/characters/character_detail.py`, `character_list.py`, `character_full.py`, `character_full_list.py` — `photo_path`/`photo_id` fields
- `games/serializers/games/players/player_character.py` — `photo_path` field
- `games/views/upload_finalize.py`, `games/views/game/_photo_set.py`, `games/views/game/_photo_detail.py` — attribute renames
- `games/tests/**` — updated assertions/fixtures (see Step 6)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Preserve the incognito-hides-photo business rule in the Character helper — this is the reason Character uses a `SerializerMethodField` instead of a plain `source='photo.path'` field like `Treasure`/`GameItem`; don't collapse it into a direct source field.
- Confirm with `makemigrations` output that Django proposes a rename (not add+drop) for both columns; a data-losing add/drop would need a different, more careful migration.
