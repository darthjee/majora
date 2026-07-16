# Issue: D&D money coins overhauling

## Description
Visual overhaul of the money display on D&D character pages, for both PCs and NPCs. Right now the character's money is rendered as a single cascading text line (e.g. `20 CP | 5 SP | 3 GP`); this replaces it with a dedicated coin component shown once per denomination (CP, SP, GP, PP), stacked vertically.

This only applies to the `dnd` game type. The `deadlands` money display (cents/dollars) is unaffected.

The coin denomination breakdown itself (CP, SP, GP, PP) is unchanged — this is a display-only change. It does not affect treasures or the trade treasures modal.

## Problem
The current money line doesn't visually distinguish coin types, hides denominations that are currently at 0, and isn't componentized on a per-coin basis.

## Expected Behavior
Affected pages (character money display, `dnd` game type only):
- `/#/games/:game_slug/pcs/:id`
- `/#/games/:game_slug/pcs/:id/edit`
- `/#/games/:game_slug/npcs/:id`
- `/#/games/:game_slug/npcs/:id/edit`

The existing money display (currently a component on the left side of the character page) shows one coin component per denomination, stacked one below the other, ordered low to high value: CP, SP, GP, PP (matching the existing internal denomination order). Each coin component is always shown, even when that denomination's amount is 0 or null.

Each coin component is a box containing:
- An icon on the left, reusing `frontend/assets/images/icons/coins.svg` for all four denominations (the icon itself is generic; distinction between denominations comes from color, not a different icon per coin).
- The coin type abbreviation, using the existing translations (English: CP, SP, GP, PP / Portuguese: PC, PP, PO, PL — already present in `frontend/assets/i18n/{en,pt}.yaml` under `money.*_abbreviation`).
- The coin amount for that denomination (shown as `0` when 0 or null).

Icon and coin type text are colored per denomination:
- CP: a color close to copper.
- SP: a color close to oxidised silver (dark grey).
- GP: a color close to gold.
- PP: a darker/more saturated platinum-ish grey, chosen so it contrasts against the white background without needing a border.

## Solution
The `dnd` rendering path currently goes through `CharacterMoneyHelper.render` (`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx`), shared by both the character show page (`CharacterHelper.jsx`) and the edit page (via `CharacterMoneyField`/`CharacterMoneyFieldHelper`) — so restyling this one rendering path covers all four affected pages.

Proposed shape:
- A new per-coin component (icon + abbreviation + amount, colored by denomination key) rendered once for each of `cp`, `sp`, `gp`, `pp`.
- A container component stacking the four coin components vertically, replacing the current `<p className="character-money">` line for `gameType === 'dnd'`.
- `deadlands` keeps using the existing cascading text line — only the `dnd` path changes.
- The coin denomination source stays `DndMoneyModel`/`CoinBreakdown`, but the character-context transform currently drops zero-quantity entries; the new component needs the full dense `cp/sp/gp/pp` set (including zeros) rather than the sparse non-zero list `CharacterMoneyHelper.render` uses today.
- `coins.svg` is a single-color glyph; since existing icons in the codebase are rendered as plain `<img src=... />` (see `HeaderHelper.jsx`), coloring it per denomination will need a different technique (e.g. CSS `mask-image` or inlining the SVG) rather than the existing `<img>` pattern.

## Benefits
Clearer, more scannable money display that visually distinguishes coin types at a glance and consistently shows all four denominations instead of omitting zero amounts.
