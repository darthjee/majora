# Plan: Add is_player to access

Issue: [410-add-is-player-to-access.md](../issues/410-add-is-player-to-access.md)

## Overview

Add a new `is_player` field to the shared `BaseAccessSerializer` response shape (`can_edit`, `username`, `is_superuser`, `is_staff`, `is_dm`, `is_owner`), following the exact same hook pattern already used for `is_dm`/`_game_for_dm`. `is_player` reports whether the requesting user is linked to the relevant game via the `Player.games` M2M relation.

## Context

`BaseAccessSerializer` (`source/games/serializers/base_access.py`) backs the four `access.json` endpoints (game, PC, NPC, treasure). `is_dm` is resolved through a `_get_is_dm`/`_game_for_dm` hook pair: the base class defaults `_game_for_dm` to `None` (→ `is_dm=False`), and `GameAccessSerializer`/`CharacterAccessSerializer` override `_game_for_dm` to return the actual game, while `TreasureAccessSerializer` overrides it too (returns `treasure.game`).

Per the issue's clarified scope, `is_player` must follow the same override pattern for `GameAccessSerializer`/`CharacterAccessSerializer` (game and PC/NPC access, i.e. any route shaped `/games/<slug>/**/access.json`), but **`TreasureAccessSerializer` must NOT override the new hook** — `is_player` stays `false` on `GET /treasures/<id>/access.json` even though the treasure has an owning game, since fixing that asymmetry is deliberately out of scope (tracked separately by the reporter).

`Player.games` (M2M, `related_name='players'` on `Game`) is currently never written by any endpoint — only touched in `games/tests/models/test_player.py`. This plan does not add a way to populate it; `is_player` will read `false` for every real user until a follow-up issue builds that flow. This is a known, accepted limitation (see issue Solution/Notes).

## Implementation Steps

### Step 1 — Add the `is_player` hook to `BaseAccessSerializer`

In `source/games/serializers/base_access.py`:
- Add `'is_player': self._get_is_player(obj)` to `to_representation`, placed after `'is_dm'` and before `'is_owner'` (matches the issue's field ordering: `is_admin`/`is_superuser`, `is_staff`, `is_dm`, `is_player`, `is_owner`).
- Add `_get_is_player(self, obj)`, mirroring `_get_is_dm`: return `None` if unauthenticated, else `game.players.filter(user=user).exists() if game else False`, where `game = self._game_for_player(obj)`.
- Add `_game_for_player(self, obj)`, mirroring `_game_for_dm`: default implementation returns `None`.

### Step 2 — Override `_game_for_player` on the game-scoped serializers

- `source/games/serializers/game_access.py` (`GameAccessSerializer`): add `_game_for_player(self, game)` returning `game`, identical in shape to the existing `_game_for_dm`.
- `source/games/serializers/character_access.py` (`CharacterAccessSerializer`, base for both PC and NPC access): add `_game_for_player(self, character)` returning `self.context.get('game')`, identical in shape to the existing `_game_for_dm`.
- Do **not** touch `source/games/serializers/treasure_access.py` — it must keep relying on the base class's default (`None` → `is_player=False`), per the issue's explicit scope decision.
- `source/games/serializers/pc_access.py` needs no change — it already inherits `_game_for_player` from `CharacterAccessSerializer` (same as it inherits `_game_for_dm` today).

### Step 3 — Tests

- `source/games/tests/serializers/test_base_access.py`: add an `is_player` test class mirroring the existing `is_staff`/`is_dm` coverage — authenticated player of the game → `True`, authenticated non-player → `False`, unauthenticated → `None`. Use `PlayerFactory` + `player.games.add(game)` (see `games/tests/models/test_player.py` for the M2M-add pattern) to set up the linked case.
- `source/games/tests/serializers/test_treasure_access.py`: add a case asserting `is_player` is always `False` on treasure access, both for an authenticated player of the treasure's owning game and for an anonymous caller — proving the deliberate non-override.
- `source/games/tests/views/games/game_access_test.py`: extend existing response-shape assertions to include `is_player`.
- `source/games/tests/views/characters/game_character_access_test.py`: extend existing response-shape assertions (shared by PC/NPC) to include `is_player`.
- `source/games/tests/views/treasures/treasure_access_test.py`: extend existing response-shape assertions to include `is_player: False`.

### Step 4 — Update the access-control reference doc

In `docs/agents/access-control.md`, add an `is_player` row to each of the three "Edit access status" field tables that already list `is_dm`/`is_owner`:
- **Game** section: `is_player` — `bool | null`, whether the requesting user is linked to this game via `Player.games`, `null` if unauthenticated.
- **Character (PC and NPC)** section: same description, scoped to the character's game.
- **Treasure** section: `is_player` — always `false` (never evaluated for treasure access; the route isn't nested under `/games/<slug>/`), with a note that this is a deliberate scope decision (mirrors the existing "Scope limitation" callouts elsewhere in this doc) and that `Player.games` is not yet populated by any endpoint.

## Files to Change

- `source/games/serializers/base_access.py` — add `_get_is_player`/`_game_for_player` and the `is_player` key.
- `source/games/serializers/game_access.py` — override `_game_for_player`.
- `source/games/serializers/character_access.py` — override `_game_for_player`.
- `source/games/tests/serializers/test_base_access.py` — new `is_player` coverage.
- `source/games/tests/serializers/test_treasure_access.py` — new `is_player` always-`False` coverage.
- `source/games/tests/views/games/game_access_test.py` — extend response-shape assertion.
- `source/games/tests/views/characters/game_character_access_test.py` — extend response-shape assertion.
- `source/games/tests/views/treasures/treasure_access_test.py` — extend response-shape assertion.
- `docs/agents/access-control.md` — document the new field on Game, Character, and Treasure.

## CI Checks

- `source/`: `poetry run pytest games/tests/views/characters/ --cov` (CI job: `pytest_views_characters`)
- `source/`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov` (CI job: `pytest_views_rest`)
- `source/`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`)

## Notes

- No migration is needed — `Player.games` already exists on the model.
- `Player.games` has no write path anywhere in the app today, so `is_player` will read `false` for every real caller in production until a follow-up issue adds a way to populate it (explicitly acknowledged and deferred by the reporter during discussion of this issue).
- `data-access` and `security` review this change post-implementation (per their standing role on any serializer-field/permission change) — no action needed from this plan itself.
