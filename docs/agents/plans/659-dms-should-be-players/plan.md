# Plan: Dms should be players

Issue: [659-dms-should-be-players.md](../../issues/659-dms-should-be-players.md)

## Overview

Refactor `Player` from a many-to-many relation with `Game` into a single `game` foreign key (mirroring `GameMaster`'s shape), add an `is_dm` boolean, migrate existing data into the new per-game shape, backfill one `Player` row per existing `GameMaster` (game, user) pair, and make game creation also create a `Player(is_dm=True)` row for the creating DM. DM permission logic itself is untouched — it keeps relying on `GameMaster`.

## Context

- `Player` (`backend/games/models/game/player.py`) currently has `games = ManyToManyField(Game, blank=True, related_name='players')`. Every real usage in the codebase (tests, `game.players.filter(user=user)` queries in `permissions.py`, `base_access.py`, `poll_vote.py`, etc.) only ever associates a player with exactly one game — the M2M is looser than reality.
- `GameMaster` (`backend/games/models/game/game_master.py`) already has the target shape: `game` FK + `user` FK + `unique_together = [('game', 'user')]`.
- Game creation (`backend/games/views/games/games_list.py`, `_create_game`) currently only creates a `GameMaster` row for the creator — no `Player` row.
- `Player.user` is nullable/optional (players without an app account can exist) and must stay that way; only `games` → `game` changes.
- `UserProfile.display_name` (added in #652, backfilled in migration `0062_backfill_userprofile_display_name.py`) is the established source for a human-readable name derived from a `User`, falling back to `username` when blank — reuse that same fallback logic here for any `Player` row created without an explicit name.
- Migration precedent: field-adding migration followed by a separate `RunPython` data migration with a no-op reverse, e.g. `0061_userprofile_display_name.py` + `0062_backfill_userprofile_display_name.py`. Latest migration in the app is `0062`, so new ones start at `0063`.
- The reverse accessor name (`related_name='players'` on `Game`) stays the same whether `Player.game` is a FK or `Player.games` is M2M — `game.players.filter(user=user)` keeps working unchanged in every one of its call sites (`permissions.py`, `base_access.py`, `poll_vote.py`, `session_messages_list.py`) since Django's reverse-FK manager also supports `.filter()`/`.all()`. No caller of `game.players` needs to change.
- What does need to change is every place that calls `player.games.add(...)` / reads `player.games` — this is exclusively in tests (~25 files under `backend/games/tests/`, all matching the pattern `<player>.games.add(<game>)`).

## Implementation Steps

### Step 1 — Add `game` FK and `is_dm` to `Player`

In `backend/games/models/game/player.py`:
- Replace `games = models.ManyToManyField(Game, blank=True, related_name='players')` with `game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')` (required, no `null`/`blank`).
- Add `is_dm = models.BooleanField(default=False)`.
- Add `class Meta: unique_together = [('game', 'user')]` (alongside the existing `ordering = ['name']`).

Generate the schema migration (`0063_player_game_is_dm` or similar via `makemigrations`) — this will include a `RemoveField` for `games` and `AddField` for `game`/`is_dm`. Since `game` has no default and no rows currently violate the eventual constraint until data is migrated, the model-level migration must run in a way that doesn't break on existing rows — split it explicitly:
- `0063_player_add_game_fk_and_is_dm.py`: `AddField(game, null=True)` (temporarily nullable) + `AddField(is_dm, default=False)`. Keep `games` M2M in place for now — do not remove it yet.

### Step 2 — Data migration: convert legacy `Player` rows to per-game shape

New migration `0064_migrate_player_games_to_game_fk.py` (`RunPython`, no-op reverse):
- For each existing `Player` row:
  - If `player.games.count() == 0`: delete the row.
  - If `player.games.count() == 1`: set `player.game = <that game>`, save.
  - If `player.games.count() > 1`: for each linked game, create a new `Player` row copying `name`/`user`/`is_dm` with `game=<that game>`; delete the original row. (`unique_together` doesn't apply yet since `game` is still nullable at this point — that's fine, it's enforced starting the next migration.)
- Use `apps.get_model('games', 'Player')` per migration convention; iterate with `.prefetch_related('games')` for efficiency.

### Step 3 — Data migration: backfill DMs

New migration `0065_backfill_player_dm.py` (`RunPython`, no-op reverse), following the `0062_backfill_userprofile_display_name.py` pattern:
- `GameMaster = apps.get_model('games', 'GameMaster')`, `Player = apps.get_model('games', 'Player')`, `UserProfile = apps.get_model('games', 'UserProfile')`.
- For each `GameMaster` row: `get_or_create(game=gm.game, user=gm.user)`; if created, set `name` from the user's `UserProfile.display_name` (falling back to `username` if blank, matching `0062`'s own fallback), and always set `is_dm=True` (including on rows that already existed from Step 2's migration).

### Step 4 — Finalize the schema

New migration `0066_player_game_required.py`:
- `AlterField(game, null=False)`.
- `RemoveField(model_name='player', name='games')`.
- `AlterUniqueTogether` / add the `unique_together = [('game', 'user')]` constraint (matches the `Meta` already written into the model in Step 1 — this migration just catches the DB schema up now that data is clean).

### Step 5 — Update game creation

In `backend/games/views/games/games_list.py` (`_create_game`), after `GameMaster.objects.create(game=game, user=request.user)`, add:
```python
Player.objects.get_or_create(game=game, user=request.user, defaults={'name': ..., 'is_dm': True})
```
Source the `name` default the same way as the migration — from `request.user`'s `UserProfile.display_name`, falling back to `username`. Import `Player` (and whatever helper resolves the display name — check if `UserProfile` already exposes a convenience method/property from #652; otherwise inline the same fallback) into this view.

### Step 6 — Fix all `player.games` usages in tests

Every test that does `<player>.games.add(<game>)` needs to become `<player>.game = <game>; <player>.save()` (or set `game=` directly at `PlayerFactory(...)` construction time, adding a `game = factory.SubFactory(GameFactory)` default to `PlayerFactory` in `backend/games/tests/factories.py` so most call sites simplify to just passing `game=` where relevant). Known call sites (grep `\.games\.add(` under `backend/games/tests/`):
- `games/tests/permissions_test.py` (4 occurrences)
- `games/tests/models/game/player_test.py`
- `games/tests/models/poll/poll_vote_test.py` (2)
- `games/tests/serializers/base_access_test.py`
- `games/tests/serializers/treasures/treasure_access_test.py`
- `games/tests/views/upload_finalize_test.py`
- `games/tests/views/polls/game_poll_detail_test.py`, `game_poll_votes_test.py` (3), `game_polls_list_test.py` (2), `game_poll_close_test.py`
- `games/tests/views/game_sessions/session_messages_list_test.py` (2), `session_poll_create_test.py`
- `games/tests/views/game/pcs/detail/game_pc_money_test.py`, `game/pcs/detail/game_pc_photo_upload_test.py`
- `games/tests/views/game/npcs/game_npc_detail_test.py` (2), `game/npcs/detail/game_npc_money_test.py`, `game/npcs/detail/game_npc_photo_upload_test.py` (2)
Also update `games/tests/factories.py`'s docstring comment referencing `player.games.add(poll.game)`.

### Step 7 — Add/extend tests for the new behavior

- `games/tests/models/game/player_test.py`: replace `test_player_can_join_game` with a test constructing `Player(game=..., ...)` directly; add tests for `unique_together(game, user)` and the `is_dm` default/override.
- `games/tests/views/games/games_list_test.py`: extend the game-creation test to assert a `Player` row is created for the creator with `is_dm=True` and `game=<new game>`.
- Add a test for the migration behavior only if the project's convention includes migration tests elsewhere (check for existing precedent, e.g. a test for `0062`'s backfill); otherwise rely on the model/view tests above, matching this repo's existing convention of not unit-testing data migrations directly.

## Files to Change

- `backend/games/models/game/player.py` — `games` M2M → `game` FK, add `is_dm`, add `unique_together`.
- `backend/games/migrations/0063_player_add_game_fk_and_is_dm.py` — new, nullable `game` + `is_dm`.
- `backend/games/migrations/0064_migrate_player_games_to_game_fk.py` — new, data migration converting legacy rows.
- `backend/games/migrations/0065_backfill_player_dm.py` — new, backfill one `Player` per `GameMaster`.
- `backend/games/migrations/0066_player_game_required.py` — new, `game` NOT NULL + drop `games` + enforce `unique_together`.
- `backend/games/views/games/games_list.py` — create a `Player(is_dm=True)` row alongside `GameMaster` on game creation.
- `backend/games/tests/factories.py` — `PlayerFactory` gets a `game` default; fix docstring.
- `backend/games/tests/models/game/player_test.py`, `games/tests/views/games/games_list_test.py` — updated/new assertions per Step 7.
- ~20 other test files under `backend/games/tests/` — mechanical `player.games.add(game)` → `player.game = game` fix (see Step 6 for the full list).

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers models, migrations-adjacent, serializers.
- `backend`: `poetry run pytest games/tests/views/` (CI jobs: `pytest_views_characters`, `pytest_views_rest`) — covers the `games_list` view test.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint.
- `backend`: `bin/reports.sh ci` (CI job: `checks`) — complexity check.

## Notes

- The DM-checking permission logic (`Game.can_be_edited_by`, `can_be_edited_by_roles`, `views/common.py`'s role resolution) intentionally still reads from `GameMaster`, not the new `Player.is_dm` — per the issue's explicit "what we are not doing", do not touch it in this issue.
- `GameMaster` is not dropped or deprecated by this issue.
- If production data ever has a `Player` linked to zero or multiple games in a way that surprises the migration in Step 2, that's an explicit, agreed-upon behavior (drop / split respectively) confirmed during issue discussion — not an open question.
