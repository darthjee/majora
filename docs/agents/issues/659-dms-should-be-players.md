# Issue: Dms should be players

## Problem
Being a DM (Dungeon Master) for a game is currently tracked only through the `GameMaster` model, entirely separate from the `Player` model. A user who DMs a game has no corresponding `Player` record for that game, so DMs are not represented in the player-facing data model.

Additionally, `Player.games` is a many-to-many field, but in practice every existing player is only ever linked to a single game — the model is looser than how it's actually used.

## Solution
- Refactor `Player.games` (many-to-many) into a single `Player.game` foreign key (required), mirroring `GameMaster`'s shape (FK to game + FK to user), with `unique_together = ('game', 'user')`.
- Add an `is_dm` boolean column to `Player` (default `False`).
- Data migration to convert existing `Player` rows to the new per-game shape:
  - Rows with zero linked games are dropped.
  - Rows with exactly one linked game are converted in place (`game` set to that game).
  - Rows linked to more than one game are split into one `Player` row per game (duplicating name/user/history onto each new row).
- Data migration to backfill DMs: for every existing `GameMaster` row, get-or-create a `Player(game=gm.game, user=gm.user)` and set `is_dm=True`. Any newly created `Player` row uses `UserProfile.display_name` (falling back to username, matching #652's own logic) as its `name`.
- Update game creation so that, alongside creating the `GameMaster` row, it also creates (or reuses, via get-or-create) a `Player(game=game, user=request.user, is_dm=True)` entry for the creator.

### What we are not doing
- Not changing the logic that determines whether a user is treated as a DM for permission checks (`Game.can_be_edited_by` and related role checks) — these keep relying on `GameMaster` for now; wiring `Player.is_dm` into permissions is a future issue/PR.
- Not dropping the `GameMaster` table — it remains the source of truth for DM permissions until a future issue.
