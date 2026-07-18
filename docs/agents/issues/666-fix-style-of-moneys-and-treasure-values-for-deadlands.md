# Issue: Fix style of moneys and treasure values for deadlands

## Description
For Deadlands games, character money and treasure values need a visual style update: a new icon for character money, a new (readable) color for treasure value text, and a unified, consistent numeric format for all treasure/money value displays across the app (replacing free-text forms like "20 Dollars").

## Problem
- On the PC/NPC show page, the money/treasure component's treasure value is rendered in yellow text, which has poor contrast/readability.
- The character money box uses an icon that should be replaced with the bootstrap `coin-cash` icon.
- The treasures list (right side of the PC/NPC show page) shows a value in a free-text, verbose format ("20 Dollars") on mouse-over, inconsistent with the treasure value component on the left.
- Across the rest of the app (PC/NPC treasures page, exchange modal, game treasures list/new/edit pages, global treasures list page, treasure show page), treasure/money values are not displayed in a single consistent format.

## Expected Behavior
- Character money icon uses bootstrap `coin-cash`.
- Character treasure value text and icon are black (`#2e2e2e`) instead of yellow.
- All treasure/money value displays (treasures list mouseover, PC/NPC treasures page, exchange modal, game treasures pages, global treasures list/show pages) use the new numeric format instead of free text, without changing the underlying value breakdown logic.
- This change applies only to Deadlands games/treasures; other game systems are unaffected.
- Frontend-only change; no backend/API changes.

## Solution
### New treasure/money value format (Deadlands only)
`$ <dollars>,<cents with leading zero>` — the `$` prefix is always included.

Examples: `$ 100,02`, `$ 0,12`, `$ 100,00`, `$ 0,00`

This format replaces the current sentence-style text (e.g. "20 Dollars") only where `game_type === 'deadlands'`. Other game types (e.g. dnd) keep their current text format unchanged.

### Character money box
- Icon changes to `bi-cash-coin` (closest bootstrap-icons match to the requested "coin-cash"; bootstrap-icons has no icon literally named `coin-cash`).

### Character treasure value box
- Text and icon color change to `#2e2e2e` (currently white `#ffffff`).
- The gold background (`.character-money-bill-treasure { background-color: gold }`) stays unchanged.

### Affected locations
- PC/NPC show page (`/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/npcs/:id`): money/treasure component (icon + color) and treasures list mouseover text.
- PC/NPC treasures page (`/#/games/:game_slug/pcs/:id/treasures`, `/#/games/:game_slug/npcs/:id/treasures`): treasure value text and exchange modal (treasure value and character money).
- Game treasures page (`/#/games/deadlands/treasures`), new page (`/#/games/deadlands/treasures/new`), edit page (`/#/games/deadlands/treasures/:id/edit`).
- Global treasures list page (`/#/treasures`) and treasure show page (`/#/treasures/:id`).

### Implementation note
Most of these locations already render treasure value text through a single shared component (`TreasureMoney`/`TreasureMoneyHelper`), so the new format can be implemented largely by branching that component's output on `game_type`, rather than editing each page individually. The character money/treasure boxes are a separate, already deadlands-only component pair that already implements the target `$ dollars,cents` numeric format and mainly needs the icon and color updates described above.

## Benefits
- Improves readability of treasure value text.
- Provides a single, consistent, compact currency format across all Deadlands money/treasure displays.
