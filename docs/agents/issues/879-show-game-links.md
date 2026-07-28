# Issue: Show game links

## Description
Game links are currently modeled through a generic, polymorphic `Link` model (`backend/games/models/link.py`, table `games_link`). A past migration (`0022_link_polymorphic`) converted a dedicated `Link.game` foreign key into a `ContentType`/`object_id` generic relation, but in practice `Link` is still only ever attached to `Game` (via `Game.links = GenericRelation('games.Link')`) — no other model uses it. `CharacterLink` (`backend/games/models/character/character_link.py`) already exists as its own dedicated, non-polymorphic model with an identical field set (`text`, `url`, `link_type`).

`GameDetailSerializer` (`backend/games/serializers/games/game_detail.py`) already exposes these links as `links` via `LinkSerializer`, so the read shape does not need to change — only the underlying model.

This issue also extracts a `BaseLink` abstract model shared by `GameLink` and `CharacterLink`, following the existing `BaseFile`/`BasePhoto` pattern (`backend/games/models/base_file.py`, `backend/games/models/base_photo.py`) already used elsewhere in this codebase for fields shared across dedicated per-entity models. Write endpoints (create/update/delete) for game links are out of scope — this issue only covers the model/table rename and existing read exposure.

## Problems
- There is no `GameLink` model or a direct relation between `Game` and `GameLink`; the generic `Link` model stands in for it.
- The `games_link` table is structured for polymorphic use (`content_type_id`, `object_id`) that is never actually exercised by any model other than `Game`.
- There is no foreign key between `games_link` and `games_game`.
- The model is named `Link` instead of `GameLink`, even though it is dedicated to games.
- The table is named `games_link` instead of `games_gamelink`.
- `GameLink` and `CharacterLink` duplicate the same `text`/`url`/`link_type` fields with no shared base, unlike other per-entity model families in this codebase (e.g. `BaseFile`, `BasePhoto`).

## Expected Behavior
- A `GameLink` model exists, backed by table `games_gamelink`, with a direct foreign key to `Game` (`game_id`), no `content_type`/generic polymorphism.
- Existing rows in `games_link` are preserved through the rename/migration — no drop-and-recreate.
- `Game.links` is a plain reverse FK relation to `GameLink` (replacing the current `GenericRelation`).
- `GameDetailSerializer` continues to expose these as `links`, now backed by `GameLink`/`GameLinkSerializer` instead of `Link`/`LinkSerializer`.
- `GameLink` and `CharacterLink` both inherit their `text`/`url`/`link_type` fields from a shared `BaseLink` abstract model; each keeps its own dedicated FK (`game`/`character`) and its own table.
- No write endpoints (create/update/delete) are added for game links in this issue.

## Solution
- Rename the table from `games_link` to `games_gamelink` (data-preserving migration, not drop/recreate).
- Remove the polymorphic `content_type`/`object_id` fields from `games_gamelink`.
- Rename `games_gamelink.object_id` to `game_id` and add a real foreign key to `games_game` (mirrors reverting migration `0022_link_polymorphic`, since `Game` was already the only consumer).
- Introduce `BaseLink` (`backend/games/models/base_link.py`) as an abstract model holding `text`, `url`, `link_type` (and the shared `LINK_TYPE_*` choices), following the `BaseFile`/`BasePhoto` pattern.
- Rename the `Link` class to `GameLink`, based on `BaseLink` (move `backend/games/models/link.py` to `backend/games/models/game/game_link.py`, following the existing `games/models/game/` layout).
- Migrate `CharacterLink` (`backend/games/models/character/character_link.py`) to also be based on `BaseLink`, without changing its table, data, or its dedicated `character` foreign key.
- Replace `Game.links = GenericRelation('games.Link')` with a direct reverse FK relation to `GameLink`.
- Rename `LinkSerializer` to `GameLinkSerializer` (`backend/games/serializers/games/game_link.py`), and update `GameDetailSerializer` to use it.
- Update all imports/exports in `games/models/__init__.py` and `games/serializers/__init__.py` accordingly, and update existing tests (`games/tests/serializers/link_test.py`, `games/tests/serializers/characters/character_link_test.py`, etc.) to match.

## Benefits
- `games_gamelink` accurately reflects that it is dedicated to games, matching the naming of `GamePhoto`, `GameDocument`, etc.
- A real foreign key to `Game` improves data integrity and query performance over the generic-relation lookup.
- Removes unused polymorphic plumbing (`content_type`/`object_id`), simplifying the model and any future maintenance.
- Shared `BaseLink` removes field duplication between `GameLink` and `CharacterLink`, matching this codebase's existing base-model conventions.
