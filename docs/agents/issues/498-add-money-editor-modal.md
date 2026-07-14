# Issue: Add money editor modal

## Problem
In the character edit page (`/#/games/:game_slug/pcs/:id/edit` and `/#/games/:game_slug/npcs/:id/edit`), links are shown using the same rendering as the show page, with an "Edit links" button that opens a modal for editing them.

Money has no equivalent. The edit page only has a single raw numeric input (total copper pieces), while the show page breaks the value down into copper (CP), silver (SP), gold (GP), platinum (PP), and gems.

## Expected Behavior
- In the edit page, money is rendered the same way it is on the show page (broken down into PP / GP / SP / CP / gems), instead of a single raw number input.
- An "Edit money" button next to the money display opens an Edit Money modal.
- The Edit Money modal shows one row per denomination — CP, SP, GP, PP, and GP in gems — each with its own numeric input, seeded from the current money breakdown.
- Hitting Cancel closes the modal without changing the character's money.
- Hitting Save recalculates the total copper value from the per-denomination inputs (CP + 10×SP + 100×GP + 1000×PP + gems-equivalent), writes it back into the edit page's local state, and closes the modal. As with the Links modal, this does not persist the character by itself — the outer edit form still needs to be submitted.

## Solution
- Follow the same Component → Controller → Helper pattern used by the existing Links edit modal (`LinksEditModal.jsx` / `LinksEditModalController.js` / `LinksEditModalHelper.jsx`) to build a `MoneyEditModal.jsx` / `MoneyEditModalController.js` / `MoneyEditModalHelper.jsx`, wired into `CharacterEdit.jsx` the same way: a `showMoneyModal` boolean state, the modal seeded from the current `money` value, `onClose` discarding local edits, and `onConfirm` writing the recalculated total back into `money` state and closing the modal.
- Add a new class responsible for **packing** per-denomination values back into a single copper total — the inverse of the existing `CoinBreakdown` class (`frontend/assets/js/utils/money/CoinBreakdown.js`), which currently only unpacks a total into denominations.
  - Packing is a straightforward sum using the relative value of each denomination (CP×1 + SP×10 + GP×100 + PP×1000, gems converted the same proportional way). The "30" cascade threshold in `CoinBreakdown` is a separate concept — it's the maximum coin count of a given type before unpacking rolls it into the next denomination — and only governs how a total is normalized back into a breakdown for display; it is not part of the packing/summing formula itself.
- Introduce a common interface class that delegates to this new packing class and to `CoinBreakdown` for unpacking, so callers use a single class for both directions.
  - Update both the character money show-page display (`CharacterMoney.jsx` / `CharacterMoneyHelper.jsx`) and the treasure money display (`TreasureMoney.jsx` / `TreasureMoneyHelper.jsx`) to go through this new common interface instead of calling `CoinBreakdown` directly (treasure keeps its own denomination set — CP/SP/GP, no platinum, no gems, threshold 10 — this only changes which class is called, not the treasure behavior).
- The modal's Save/Confirm button is disabled while any denomination input is negative or non-integer, mirroring the Links modal's `canConfirm` gate.
- Reuse the already-translated `money.*` i18n keys (`platinum_piece`, `gold_piece`, `silver_piece`, `copper_piece`, `gems`, `gp_in_gems`, and the abbreviation keys) for the modal's row labels — these already exist in both `en.yaml` and `pt.yaml` but are currently unused in JS. Add a new `money_edit_modal:` i18n namespace (title, confirm, cancel) analogous to the existing `links_edit_modal:` namespace.

### Translation reference
| English | Portuguese |
| -------- | ------------ |
| CP | PC |
| SP | PP |
| GP | PO |
| PP | PL |
| Copper Pieces | Peças de Cobre |
| Silver Pieces | Peças de Prata |
| Gold Pieces | Peças de Ouro |
| Platinum Pieces | Peças de Platina |
