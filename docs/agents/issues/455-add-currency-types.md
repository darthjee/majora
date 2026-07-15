# Issue: Add currency types

## Description
This issue depends on #454 (`Game.game_type`, values `dnd`/`deadlands`). Games now have a type, so currency handling for treasures and character money should follow it: D&D games use CP/SP/GP/PP coins, Deadlands games use Cents/Dollars. Today, `Character.money` and `Treasure.value` are stored as a flat integer (implicitly a D&D copper-piece equivalent), and all coin breakdown/display logic is D&D-only, hardcoded on the frontend.

## Problem
All money/treasure display and editing across the app assumes D&D's coin system:
- `frontend/assets/js/utils/money/MoneyModelRegistry.js` is a registry (`name -> model class`) already built to resolve a money model by game type, but only `DndMoneyModel` is registered.
- Three call sites hardcode `MoneyModelRegistry.resolve('dnd')`: `CharacterMoneyHelper.jsx`, `MoneyEditModalController.js`, `TreasureMoneyHelper.jsx`.
- `Treasure` has no field recording which currency system applies to it, so there is nothing to resolve a non-D&D model from for a treasure.

## Expected Behavior

### D&D rules (already implemented)

Money is defined by coins:
- CP - Copper Piece (the lowest value)
- SP - Silver Piece (worth 10 Copper Pieces)
- GP - Gold Piece (worth 10 Silver Pieces)
- PP - Platinum Piece (worth 10 Gold Pieces)
- Gems are also shown, valued in Gold Pieces

**Max quantity — character pages**: break down money into coins, showing a maximum of 30 CP / 30 SP / 30 GP / 30 PP; the rest is shown as GP-worth in gems.

**Max quantity — treasure pages**: break down money into coins, showing a maximum of 30 CP / 30 SP; the rest is shown in GP.

### Deadlands rules (to be implemented)

Money is Cents and Dollars:
- Cents (the lowest value)
- Dollars (worth 100 Cents)

**Max quantity — character pages**: break down money into a maximum of 100 Cents; the rest is shown in Dollars.

**Max quantity — treasure pages**: same as character pages — a maximum of 100 Cents; the rest is shown in Dollars.

### Treasure currency type
- Every treasure has its own currency type, fixed at creation (no edit afterwards — same immutability as `Game.game_type` in #454).
- When a treasure is created inside a game (game treasure pages), its type is forced to that game's type — the creation form shows no type picker in that flow.
- When a treasure is created standalone (`/#/treasures/new`, no game context), the creation form shows a D&D/Deadlands dropdown, same pattern as the Game creation form in #454.

### Character/PC/NPC money
- Currency type is derived from the character's own game at render/edit time — no new stored field on `Character`.

### Affected places
- PC show page `/#/games/:game_slug/pcs/:id`
- PC edit page `/#/games/:game_slug/pcs/:id/edit` (PC money edit modal)
- NPC show page `/#/games/:game_slug/npcs/:id`
- NPC edit page `/#/games/:game_slug/npcs/:id/edit` (NPC money edit modal)
- NPC new page `/#/games/:game_slug/npcs/new` (NPC money edit modal)
- PC treasures page `/#/games/:game_slug/pcs/:id/treasures` (PC trade treasure modal)
- NPC treasures page `/#/games/:game_slug/npcs/:id/treasures` (NPC trade treasure modal)
- Treasures page `/#/treasures`
- Treasures show page `/#/treasures/:id`
- Treasures edit page `/#/treasures/:id/edit` (Treasures value modal)
- Treasures new page `/#/treasures/new` (Treasures value modal)
- Game treasures page `/#/games/:game_slug/treasures`
- Game treasures show page `/#/games/:game_slug/treasures/:id`
- Game treasures edit page `/#/games/:game_slug/treasures/:id/edit` (Treasures value modal)
- Game treasures new page `/#/games/:game_slug/treasures/new` (Treasures value modal)

## Solution
- Backend: add a currency-type field to `Treasure` (mirroring `Game.game_type`'s choices/shape from #454), fixed at creation. Treasure-creation endpoints scoped to a game force the value to that game's type (ignoring/rejecting any client-provided value); the standalone treasure-creation endpoint accepts it from the client, defaulting to `dnd`.
- Frontend: extend `frontend/assets/js/utils/money/MoneyModelRegistry.js` with a `DeadlandsMoneyModel`, following the existing `DndMoneyModel`/`CoinBreakdown`/`CoinPacker` structure, implementing the Deadlands rules above.
- Rename the existing generic (currently D&D-flavored) wrapper classes/components that will now render either currency to system-agnostic names — e.g. the shared money-display/edit components (`CharacterMoney`, `TreasureMoney`, the money edit modal, the trade-treasure modal) — while keeping `DndMoneyModel` itself named for the D&D-specific implementation (it stays alongside the new `DeadlandsMoneyModel`, both behind the registry).
- Replace the three hardcoded `MoneyModelRegistry.resolve('dnd')` call sites (`CharacterMoneyHelper.jsx`, `MoneyEditModalController.js`, `TreasureMoneyHelper.jsx`) with resolution based on the relevant game's/treasure's type.
- Add a currency-type dropdown to the standalone treasure creation form, matching the Game creation form pattern from #454.
- Update the affected components across the pages listed above to work for both currency types.

## Benefits
- Money/treasure display and editing correctly reflects each game's tabletop system.
- Establishes a clear, reusable extension point (`MoneyModelRegistry`) for any future currency systems beyond D&D and Deadlands.
