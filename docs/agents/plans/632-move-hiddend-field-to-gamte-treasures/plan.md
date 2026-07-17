# Plan: Move hidden field from Treasure to GameTreasure

Issue: [632_move-hidden-field-to-gametreasure.md](../../issues/632-move-hiddend-field-to-gamte-treasures.md)

## Overview

`Treasure.hidden` moves to `GameTreasure.hidden`, becoming a genuinely per-`(game,
treasure)` attribute instead of a single flag shared across every game a treasure is
linked to. Backend adds the new field/migration, relocates every read of `hidden` to
resolve through the game-scoped `GameTreasure` row (adding hidden-filtering to two
endpoints that don't currently gate on it at all), and adds three DM-only endpoints/payload
changes so a DM can see and act on hidden treasures without leaking them to players.
Frontend wires the DM-facing treasures page and the PC/NPC treasure trade modal to use
those new capabilities.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**`hidden` field placement**: `GameTreasure.hidden` (`boolean`, default `false`) replaces
`Treasure.hidden` (dropped from the model entirely). Every treasure visible to a game
already has a matching `GameTreasure` row (exclusive or M2M-linked), so this covers every
case a game-scoped page can encounter.

**Endpoints unaffected by this issue** (keep exactly their current request/response
shape): `GET /games/:slug/treasures.json`, `GET /games/:slug/npcs/:id/treasures.json`
(now also filters hidden — see backend.md — but the shape of each returned item is
unchanged), `GET /games/:slug/pcs/:id/treasures.json`, `POST
/games/:slug/pcs/:id/treasures/sell.json`, `POST /games/:slug/npcs/:id/treasures/sell.json`.

**Endpoints whose behavior changes** (existing routes, no URL change):
- `POST /games/:slug/pcs/:id/treasures/acquire.json` and `POST
  /games/:slug/npcs/:id/treasures/acquire.json` — now 404 when `treasure_id` refers to a
  treasure hidden (`GameTreasure.hidden == true`) for that game. Previously these did not
  check `hidden` at all.
- `GET /games/:slug/treasures/all.json` — unchanged behavior (DM/superuser-only, already
  returns hidden treasures), but each item in the response gains a `hidden: boolean` field.

**New endpoints** (all `GameEditPermission` — superuser, staff, or that game's GameMaster,
same check already used by `treasures/all.json`):
- `GET /games/:slug/npcs/:id/treasures/all.json` — mirrors `GET
  /games/:slug/npcs/:id/treasures.json` (the NPC's owned-treasures list) but does not
  filter out hidden treasures, and each item gains `hidden: boolean`.
- `POST /games/:slug/pcs/:id/treasures/acquire/all.json` — mirrors `POST
  /games/:slug/pcs/:id/treasures/acquire.json` (same `{treasure_id, quantity}` request,
  same `{quantity, money, acquired}` response) but does not 404 on a hidden treasure.
- `POST /games/:slug/npcs/:id/treasures/acquire/all.json` — same as above, for NPCs.

**Write path** (game-scoped, exclusive treasures only — the M2M-linked case stays
out of scope, same as today): `POST /games/:slug/treasures.json` (create) and `PATCH
/games/:slug/treasures/<id>.json` / `PATCH /treasures/<id>.json` (update, when the
treasure is exclusive to a game) keep accepting `hidden` in the request body, now writing
it onto the treasure's `GameTreasure` row instead of onto `Treasure`. `hidden` is dropped
entirely from the global, non-game-scoped create (`POST /treasures.json`, when no game is
resolved) — there is no game to scope it to, and the global list/detail endpoints already
ignore `hidden` regardless (per `docs/agents/access-control/treasure.md`'s existing "Scope
limitation" note).

## Notes

- The M2M-linked (shared) treasure case for toggling `hidden` per game has no write path in
  this issue (same as today's `max_units`-only linked-treasure PATCH) — it stays
  Django-admin-only. A future issue can extend `PATCH /games/:slug/treasures/<id>.json` to
  accept `hidden` for the linked case too, mirroring `max_units`.
- `docs/agents/access-control/treasure.md` and `docs/agents/access-control/game-treasure.md`
  need updating in the same PR (backend's responsibility, since it owns that doc set).
