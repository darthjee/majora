# Issue: Add treasure list edit for games

## Description
Add an "Add treasure" button on the game treasures page (`/#/games/:game_slug/treasures`) that opens a modal listing existing `Treasure` records not yet linked to the game, letting a DM/superuser select one, edit its game-specific `value`, `hidden`, and `max_units`, and create the corresponding `GameTreasure`.

## Problem
The game treasures page currently only supports creating brand-new "exclusive" treasures for a game via a separate page (`#/games/:game_slug/treasures/new`, backed by `POST /games/:game_slug/treasures.json`). There is no way to attach an existing `Treasure` from the shared catalog (matching the game's `game_type`) to a game as a `GameTreasure`.

## Expected Behavior
- New endpoint `GET /games/:game_slug/treasures/missing.json` lists `Treasure` records with `game_type` matching the game's `game_type` that have no existing `GameTreasure` for this game (i.e. not yet linked). The `hidden` filter does not apply here (`hidden` lives on `GameTreasure`, not `Treasure`). Gated to DM-of-the-game/superuser, same as `treasures/all.json`.
- The game treasures page gets a new "Add treasure" button, visible under the same edit permission as the existing "New" button.
- Clicking it opens a modal listing treasures from the `missing` endpoint.
- Clicking a treasure in the list shows its photo/info and a form with:
  - `value` — prefilled from `Treasure.value`, editable.
  - `hidden` — boolean switch.
  - a switch that toggles visibility of a `max_units` field; when off, `max_units` is sent as `null`.
- Saving submits a create request against a new dedicated endpoint (see Solution) with the selected treasure's id plus `value`/`hidden`/`max_units`, closes the modal, and reloads the page's treasure list.

## Solution
**Backend**
- Add a new endpoint, `POST /games/:game_slug/treasures/link.json`, dedicated to linking an existing `Treasure` to a game: accepts `treasure_id`, `value`, `hidden`, `max_units`; validates the treasure matches the game's `game_type` and doesn't already have a `GameTreasure` for this game, then creates only the `GameTreasure` row. The existing `POST /games/:game_slug/treasures.json` (`game_treasures.py`) is left untouched and keeps creating brand-new exclusive treasures.
- Both the new `link.json` endpoint and the `missing.json` endpoint below are gated by `GameEditPermission` (DM of the game, or superuser) — same as the existing create endpoint and `treasures/all.json`.
- Add `GET /games/:game_slug/treasures/missing.json`, mirroring `treasures/all.json`'s structure/permission, returning treasures of the game's `game_type` excluding any that already have a `GameTreasure` for this game (mirroring the `Exists(...)` pattern used by `_exclude_hidden` in the same file).

**Frontend**
- Add an `AddGameTreasureModal` (component + controller + helper) under `resources/treasure/pages/elements/`, mirroring `TreasureExchangeModal`'s list → select → form shape (browse/select/search state, `react-bootstrap` `Modal`).
- Wire an "Add treasure" button into `GameTreasuresHelper.jsx`'s `PageActions`, toggling the new modal (same `show`/`onClose`/`onSuccess` pattern already used for `PhotoUploadModal` on this page).
- On success, reload the treasures list via the page's existing refresh mechanism.

## Benefits
- DMs can attach existing catalog treasures to a game without recreating them as exclusive duplicates.
- Keeps the treasure catalog consistent by reusing `Treasure` records instead of accumulating near-duplicate exclusive ones.
