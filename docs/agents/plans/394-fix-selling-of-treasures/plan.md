# Plan: Fix selling of treasures

Issue: [394-fix-selling-of-treasures.md](../issues/394-fix-selling-of-treasures.md)

## Overview

Root-caused via a runtime reproduction (not just static reading): `POST
.../treasures/sell.json` re-validates that the treasure is still linked to the
game's *current* catalog (`_find_game_treasure`, shared with the acquire
endpoint), even though selling only requires that the character *owns* the
treasure. Once a treasure a character already owns is removed from a game's
catalog (DM deletes the `GameTreasure` link, or an exclusive treasure's `game`
FK is cleared/reassigned), every subsequent sell attempt for that
already-owned treasure 404s — matching the reported "fails the same way for
every combination tried," since this affects any previously-acquired,
since-delisted treasure. The fix decouples sell's treasure resolution from the
game-scoped catalog lookup, resolving the treasure by id alone and letting the
existing ownership check (`_lock_character_treasure`) be the sole gate for
sell authorization.

## Context

- Route: `games/urls.py` — `games/<slug:game_slug>/pcs/<int:character_id>/treasures/sell.json` → `game_pc_treasure_sell` (and the NPC counterpart).
- View: `games/views/characters/game_pc_treasure_sell.py` / `game_npc_treasure_sell.py` resolve `Game`/`Character`, then delegate to `character_treasure_sell` in `games/views/characters/_treasure_exchange.py`.
- `_treasure_exchange.py`'s `_authorize_and_parse` is shared by both `character_treasure_acquire` and `character_treasure_sell`. It calls `_find_game_treasure(game, treasure_id)`, which requires the treasure to be currently exclusive to (`treasure.game == game`) or M2M-linked to (`GameTreasure` row exists) the game. This makes sense for **acquire** (you can only buy what's currently in the shop) but is wrong for **sell** — a character should be able to sell what they already own even if a DM later delists it from the game's catalog.
- `_sell` already performs the real ownership check via `_lock_character_treasure(character, treasure)`, which is scoped to the character (and therefore implicitly to the game, since `character.game` is fixed) — this is sufficient on its own; the extra catalog-membership check in `_find_game_treasure` is redundant and actively harmful for sell.
- Reproduced locally (via `docker-compose run --rm majora_tests poetry run pytest`) with a throwaway test: create a character owning a treasure, delete the `GameTreasure` link, then POST sell — confirmed it currently returns `404 {"detail":"Not found."}` exactly as reported, and would return `200` once the catalog check is removed from the sell path.

## Implementation Steps

### Step 1 — Split treasure resolution between acquire and sell

In `source/games/views/characters/_treasure_exchange.py`:
- Change `_authorize_and_parse` to accept a `resolve_treasure` callable (or split into two thin wrappers) so `character_treasure_acquire` keeps using `_find_game_treasure` (game-catalog-scoped, unchanged behavior), while `character_treasure_sell` resolves the treasure by id only — existence-only lookup (`Treasure.objects.filter(id=treasure_id).first()`, raising `Http404` when the id doesn't exist at all).
- Keep `_find_game_treasure` as-is for acquire; add a small `_find_treasure_by_id` (or similar) helper for sell that does not filter by game.
- No change to `_sell`'s ownership/locking logic (`_lock_character_treasure`) — it remains the authorization gate for "does this character actually own this treasure."

### Step 2 — Regression tests

In `source/games/tests/views/characters/game_character_treasure_sell_test.py`, add a test (to both the PC and NPC shared base test class, or the shared base if straightforward) reproducing the exact scenario: character owns a treasure, the treasure is then unlinked from the game (`GameTreasure` row deleted / M2M removed, or its exclusive `game` FK cleared), and selling it still succeeds (200, refunds money, decrements quantity). Also confirm `test_selling_never_owned_treasure_returns_404` (already present) still passes unchanged — selling something never owned must still 404.

### Step 3 — Full local verification

Run the full backend test suite for the touched files (and the broader `games/tests/views/characters/` suite, since acquire's behavior must remain unchanged) via `docker-compose run --rm majora_tests poetry run pytest games/tests/views/characters/`.

## Files to Change

- `source/games/views/characters/_treasure_exchange.py` — decouple sell's treasure resolution from the game-catalog check; keep acquire's behavior unchanged.
- `source/games/tests/views/characters/game_character_treasure_sell_test.py` — add regression test(s) for selling an owned-but-delisted treasure.

## CI Checks

- `source/`: `poetry run pytest games/tests/views/characters/` (CI job: `pytest_views_characters`)

## Notes

- This does not change the acquire endpoint's behavior at all — acquiring still requires the treasure to be currently in the game's catalog.
- The fix does not need any frontend, proxy, or infra changes — this is a pure backend authorization-logic bug, and no API contract (request/response shape) changes.
- No new endpoint, serializer field, or permission/visibility logic is introduced — access control review is not required for this issue (existing `CharacterEditPermission` gate is untouched).
