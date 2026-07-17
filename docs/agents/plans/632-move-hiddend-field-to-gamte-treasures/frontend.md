# Frontend Plan: Move hidden field from Treasure to GameTreasure

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint/payload list this
depends on. In short: `GET /games/:slug/treasures/all.json` items gain `hidden: boolean`;
new `GET /games/:slug/npcs/:id/treasures/all.json` (same shape as the existing
`treasures.json`, plus `hidden`); new `POST /games/:slug/pcs/:id/treasures/acquire/all.json`
and `POST /games/:slug/npcs/:id/treasures/acquire/all.json` (identical request/response
shape to the existing `acquire.json` pair). All three new/changed reads are
`GameEditPermission`-gated server-side (superuser/staff/that game's DM) — frontend should
still condition on the existing `canEdit`/`AccessStore` permission check before calling
them, to avoid a pointless 401/403 round trip for regular players.

## Implementation Steps

### Step 1 — `TreasureClient`/`CharacterClient` additions

- `frontend/assets/js/client/TreasureClient.js` — add a `fetchGameTreasuresAllPage`-style
  method calling `GET /games/:slug/treasures/all.json` (mirror
  `fetchGameTreasuresPage`'s params/pagination handling).
- `frontend/assets/js/client/CharacterClient.js` — add an `acquireTreasureAll` (or
  parameterize the existing `acquireTreasure`) hitting
  `/games/:gameSlug/:characterKind/:characterId/treasures/acquire/all.json`, and a
  `fetchTreasuresAllPage` (or parameterize `fetchTreasuresPage`) hitting
  `/games/:gameSlug/npcs/:characterId/treasures/all.json` (NPC-only — PCs have no `all.json`
  variant per the issue).

### Step 2 — DM treasures page shows hidden treasures

- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js`
  currently always fetches `/games/:slug/treasures.json` (line 65) — the player-facing,
  hidden-filtered endpoint — even though this page (`/#/games/:game_slug/treasures`) is
  where a DM manages the game's catalog. Switch it to call `treasures/all.json` once
  `canEdit` resolves `true` (fall back to the existing filtered endpoint for a non-editor
  viewer, if this page is reachable by players at all — check
  `frontend/assets/js/utils/access/accessRouteConfig.js` for who can route here).
- Surface the new `hidden` field in whatever list/row component renders each treasure on
  this page (a badge/icon is consistent with how other hidden-ish states are shown
  elsewhere in the app — check existing patterns before inventing a new one).

### Step 3 — DM trading with hidden treasures

- `frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js`
  is shared by both the PC and NPC treasure trade modals. Its `fetchAcquirePage`/`acquire`
  currently always call the regular (hidden-filtered/hidden-gated) endpoints. Add an
  edit-mode branch (informed by the same `canEdit` the page already tracks) that calls
  `treasures/all.json`/`acquire/all.json` instead, so a DM trading a hidden treasure onto a
  PC or NPC doesn't get a 404.
- `frontend/assets/js/components/resources/character/pages/controllers/NpcCharacterTreasuresController.js`
  — the NPC's own treasures-held list (`GET .../treasures.json`) should switch to the new
  `treasures/all.json` variant for a DM viewer, so they can see (and later trade away) a
  hidden treasure already sitting in that NPC's inventory. `PcCharacterTreasuresController.js`
  needs no change — a PC's own treasures list was never hidden-filtered.

### Step 4 — Specs

Add/update Jasmine specs for every controller/client method touched above, following this
project's existing spec conventions (mirrored file tree under `frontend/specs/`).

## Files to Change

- `frontend/assets/js/client/TreasureClient.js`
- `frontend/assets/js/client/CharacterClient.js`
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js`
- `frontend/assets/js/components/resources/treasure/pages/**` (whatever component renders
  each treasure row/badge on the DM treasures page)
- `frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js`
- `frontend/assets/js/components/resources/character/pages/controllers/NpcCharacterTreasuresController.js`
- Corresponding specs under `frontend/specs/` mirroring every file above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Run inside the project containers per `AGENTS.md` (`docker-compose run --rm majora_fe
  yarn ...`), never directly on the host.
- No i18n keys are known to be needed yet (no `hidden`-related copy currently exists for
  treasures) — add translation keys under `frontend/assets/i18n/` for any new label/badge
  text introduced in Step 2, and hand off to the `translator` agent's conventions if this
  grows beyond a couple of keys.
