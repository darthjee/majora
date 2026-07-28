# Plan: Show game links

Issue: [879-show-game-links.md](../issues/879-show-game-links.md)

## Overview
Convert the generic, polymorphic `Link` model into a dedicated `GameLink` model with a real foreign key to `Game`, renaming the table from `games_link` to `games_gamelink` without losing data. Extract a shared `BaseLink` abstract model (mirroring the existing `BaseFile`/`BasePhoto` pattern) and base both `GameLink` and `CharacterLink` on it. No API/serializer field shape changes and no write endpoints — this is a backend-only, read-shape-preserving refactor.

## Context
- `Link` (`backend/games/models/link.py`, table `games_link`) was made polymorphic in migration `0022_link_polymorphic`, converting a dedicated `game` FK into `content_type`/`object_id`. In practice `Game` (`backend/games/models/game/game.py`) is still the only consumer, via `Game.links = GenericRelation('games.Link')`.
- `CharacterLink` (`backend/games/models/character/character_link.py`) already duplicates `Link`'s `text`/`url`/`link_type`/`LINK_TYPE_*` fields as its own dedicated, non-polymorphic model with a direct `character` FK.
- `GameDetailSerializer` (`backend/games/serializers/games/game_detail.py`) exposes `links` via `LinkSerializer` (`backend/games/serializers/link.py`) with fields `['id', 'text', 'url', 'link_type']` — this exact shape must be preserved.
- `CharacterDetailSerializer` exposes `links` via `CharacterLinkSerializer` with the same field list — must also be preserved unchanged.
- This codebase already has a precedent for shared abstract base models: `BaseFile` and `BasePhoto` (`backend/games/models/base_file.py`, `backend/games/models/base_photo.py`).

## Implementation Steps

### Step 1 — Introduce `BaseLink`
Create `backend/games/models/base_link.py`: an abstract model holding `text` (`CharField(max_length=200)`), `url` (`URLField`), `link_type` (`CharField(max_length=32, choices=LINK_TYPE_CHOICES, blank=True, default='')`), and the `LINK_TYPE_*` constants/`LINK_TYPE_CHOICES` currently duplicated in both `Link` and `CharacterLink`. Follow `BasePhoto`'s shape: `class Meta: abstract = True`, plus a `HistoricalRecords(app='versioning', user_db_constraint=False, inherit=True)` on the base so both subclasses keep history tracking (matches `BasePhoto`'s `inherit=True` pattern — verify this preserves each subclass's own historical table name, since `CharacterLink`'s existing historical table must not change).

### Step 2 — Rename `Link` → `GameLink`, add dedicated FK, drop polymorphism
Move `backend/games/models/link.py` to `backend/games/models/game/game_link.py`, rename the class `Link` → `GameLink`, base it on `BaseLink`, and add `game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='links')`. Remove `content_type`/`object_id`/`content_object`.

Write a data-preserving migration (do not drop/recreate the table):
1. `migrations.RenameModel('Link', 'GameLink')` — Django renames the table to `games_gamelink` automatically since neither model sets a custom `Meta.db_table`.
2. Add a nullable `game` FK field.
3. `RunPython` to populate `game_id` from `object_id` for every row (mirroring the reverse of `0022_link_polymorphic`'s `populate_content_type`; since `Game` is already the only consumer, every existing row's `content_type` should point to `Game` — assert/filter defensively rather than assuming, and skip/log any row that doesn't, per the existing data-safety concern raised in the issue).
4. Make the `game` FK non-nullable, remove `content_type` and `object_id`.

Update `Game.links` (`backend/games/models/game/game.py`) from `GenericRelation('games.Link')` to the plain reverse relation implied by the new FK's `related_name='links'` (i.e. drop the explicit `GenericRelation` field entirely — the reverse accessor comes for free from `GameLink.game`'s `related_name`).

### Step 3 — Migrate `CharacterLink` onto `BaseLink`
Update `backend/games/models/character/character_link.py` so `CharacterLink` inherits from `BaseLink` instead of duplicating its fields, keeping its own `character` FK and its own table (`games_characterlink`) unchanged. Write a migration limited to whatever field/history-table adjustments Django generates from this inheritance change — no data migration needed here since the table and columns don't change, only the class hierarchy. Verify via `makemigrations --check` / `makemigrations --dry-run` that no unexpected table rename or column change is proposed for `CharacterLink`; if `HistoricalRecords(inherit=True)` on `BaseLink` causes an unwanted historical-model change for `CharacterLink`, keep `HistoricalRecords` declared on each concrete subclass instead of on `BaseLink`.

### Step 4 — Rename serializer and update references
Move `backend/games/serializers/link.py` to `backend/games/serializers/games/game_link.py`, rename `LinkSerializer` → `GameLinkSerializer`, `model = GameLink`, same `fields = ['id', 'text', 'url', 'link_type']`. Update `GameDetailSerializer` to import and use `GameLinkSerializer`.

### Step 5 — Update imports/exports and tests
Update `games/models/__init__.py` (replace the `Link` import/export with `GameLink`, keep alphabetical placement matching the `games/models/game/` block) and `games/serializers/__init__.py` (replace `LinkSerializer` with `GameLinkSerializer`, placed alongside the other `games.*` serializer imports). Rename/update `games/tests/serializers/link_test.py` → `games/tests/serializers/games/game_link_test.py` (adjust import and fixture setup to use `GameLink`/`GameLinkSerializer` and a real `game` FK instead of the generic relation). Search the test suite for any other `Link`/`LinkSerializer`/`games.Link` references (model factories/fixtures, `game_test.py`, etc.) and update them.

## Files to Change
- `backend/games/models/base_link.py` — new abstract `BaseLink` model (text/url/link_type/history).
- `backend/games/models/link.py` — deleted (moved).
- `backend/games/models/game/game_link.py` — new `GameLink` model (was `Link`), based on `BaseLink`, with `game` FK.
- `backend/games/models/game/game.py` — replace `GenericRelation('games.Link')` with the plain reverse FK relation.
- `backend/games/models/character/character_link.py` — base `CharacterLink` on `BaseLink`; keep its own `character` FK.
- `backend/games/models/__init__.py` — swap `Link` for `GameLink` in imports/`__all__`.
- `backend/games/migrations/00XX_gamelink.py` — rename table/model, drop polymorphism, add `game` FK, data-preserving.
- `backend/games/migrations/00XX_characterlink_baselink.py` — `CharacterLink` inheritance change (no data/table change expected).
- `backend/games/serializers/link.py` — deleted (moved).
- `backend/games/serializers/games/game_link.py` — new `GameLinkSerializer` (was `LinkSerializer`).
- `backend/games/serializers/games/game_detail.py` — import/use `GameLinkSerializer`.
- `backend/games/serializers/__init__.py` — swap `LinkSerializer` for `GameLinkSerializer`.
- `backend/games/tests/serializers/link_test.py` — moved/renamed to `backend/games/tests/serializers/games/game_link_test.py`, updated to `GameLink`/`GameLinkSerializer`.
- Any other test fixtures/factories referencing `Link`/`games.Link` — updated to `GameLink`.

## CI Checks
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes
- The data migration must not assume every `games_link` row's `content_type` is `Game` — verify against actual data (or filter defensively) before renaming `object_id` to `game_id`, per the issue's explicit "there is already data ... we cannot drop and recreate" constraint.
- Confirm whether `HistoricalRecords(inherit=True)` belongs on `BaseLink` or on each concrete subclass — `BasePhoto` uses `inherit=True` on the base, but `CharacterLink`'s existing historical table/migrations must not be altered unexpectedly; run `makemigrations --check` to be sure before finalizing.
- Out of scope (per issue): no write endpoints (create/update/delete) for `GameLink`.
