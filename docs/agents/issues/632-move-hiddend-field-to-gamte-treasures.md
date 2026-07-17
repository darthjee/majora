# Issue: Move hidden field from Treasure to GameTreasure

## Description
The `Treasure` model currently has a `hidden` boolean field (default `False`), used to keep a treasure invisible to players until they discover/acquire it. This field should move to `GameTreasure` — the per-`(game, treasure)` join model — instead of living on `Treasure` itself, and be dropped from `Treasure`.

## Problem
A `Treasure` can be shared across multiple games (M2M-linked via `GameTreasure`) or be exclusive to a single game (via `Treasure.game`). Because `hidden` currently lives on `Treasure`, hiding a shared treasure in one game hides it in every game it is linked to — there is no way to hide it in just one game while keeping it visible in another.

Additionally, `hidden` is never exposed in any read serializer, so DM/admin-facing tooling has no way to see which treasures are currently hidden per game.

## Expected Behavior
- `hidden` becomes a genuinely per-`(game, treasure)` attribute stored on `GameTreasure`, replacing `Treasure.hidden` (dropped). A treasure M2M-linked to multiple games can now be hidden in one and visible in another. Every treasure visible to a game already has a matching `GameTreasure` row (exclusive or M2M-linked), so this covers both cases.
- Endpoints that list/return treasures to regular players keep filtering out hidden treasures (or 404 on a hidden treasure), now resolving `hidden` off the game-scoped `GameTreasure` row instead of `Treasure`:
  - `GET /games/:slug/treasures.json`
  - `POST /games/:slug/pcs/:id/treasures/acquire.json` and `POST /games/:slug/npcs/:id/treasures/acquire.json` (404 when the given treasure id is hidden for that game)
  - `GET /games/:slug/npcs/:id/treasures.json`
- Endpoints that work with a treasure a character already owns stay unaffected by hidden status (a character keeps what it has even if the treasure is later hidden):
  - `GET /games/:slug/pcs/:id/treasures.json`
  - `POST /games/:slug/pcs/:id/treasures/sell.json` and `POST /games/:slug/npcs/:id/treasures/sell.json`
- New DM/admin (`GameEditPermission`) capabilities, so a DM can manage and trade hidden treasures without exposing them to players:
  - The existing `GET /games/:slug/treasures/all.json` (already DM/admin-only, already returns hidden treasures) starts including the `hidden` field in its payload.
  - New `POST /games/:slug/pcs/:id/treasures/acquire/all.json` and `POST /games/:slug/npcs/:id/treasures/acquire/all.json`, mirroring the existing acquire endpoints but accepting hidden treasures (for a DM granting a hidden treasure to a character).
  - New `GET /games/:slug/npcs/:id/treasures/all.json`, mirroring the existing NPC treasures listing but including hidden treasures and the `hidden` field (for a DM viewing/trading an NPC’s full treasure set).
  - All of the above restricted to the same `GameEditPermission` (superuser, staff, or that game’s DM) already used by `treasures/all.json`.
- `hidden` stays settable at treasure-creation time on `POST /games/:slug/treasures.json` (game-scoped, creates an exclusive treasure), writing onto the newly-created `GameTreasure` row. It is dropped entirely from the global `POST /treasures.json`/`PATCH /treasures/<id>.json` — a fully global treasure has no `game` to scope `hidden` to, and the global list/detail endpoints already ignore `hidden` regardless.
- Toggling `hidden` after creation for an M2M-linked (shared) treasure stays out of scope for this issue — same as the `(game, treasure)` link itself, it remains Django-admin-only for now. Only the exclusive-treasure case keeps its existing game-scoped `PATCH` write path (now writing to `GameTreasure.hidden` instead of `Treasure.hidden`).

## Solution
- Migration: add `hidden` (`BooleanField`, default `False`) to `GameTreasure`; backfill from `Treasure.hidden` for existing rows; then drop `Treasure.hidden`.
- Update the views/serializers that currently read `Treasure.hidden` (`game_treasures`, `game_treasure_detail`’s hidden-gate, acquire/list views) to resolve `hidden` via the game-scoped `GameTreasure` row instead.
- Update `TreasureCreateSerializer`/`TreasureUpdateSerializer` on the game-scoped exclusive-treasure path to write `hidden` onto `GameTreasure`; drop `hidden` from the global (non-game-scoped) create/update serializers.
- Add the three new/extended DM-facing endpoints above, following the existing `GameEditPermission.check()` inline-authorization pattern already used by `game_treasures_all`.
- Update `docs/agents/access-control/treasure.md` and `docs/agents/access-control/game-treasure.md` to reflect the new field location and endpoints.

## Benefits
- A treasure shared across multiple games can be hidden independently per game, instead of being hidden everywhere it is linked.
- DM/admin tooling can see and act on hidden treasures (list, acquire on behalf of a character) without ever leaking them to players.
