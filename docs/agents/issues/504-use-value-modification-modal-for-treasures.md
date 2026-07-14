# Issue: Use value modification modal for treasures

## Description
Treasure forms currently expose the treasure `value` as a single raw number input. Player and NPC character forms already provide a friendlier editing experience through a money-editing modal that breaks the value down by currency denomination. We want the same kind of experience on treasure forms, restricted to `CP`, `SP` and `GP` (no `PP` or gems), consistent with how treasure values are already broken down for display on the treasure listing/detail pages.

## Problem
On the affected treasure form pages, `value` is edited as a single raw number, which makes it hard to reason about a treasure's worth in terms of actual coins. There is no way to compose or edit the value by denomination the way PC/NPC forms already allow for character money.

## Expected Behavior
- The existing plain numeric `value` input is removed from the treasure form entirely — value is only editable through the breakdown display and modal described below, matching the PC/NPC pattern.
- On treasure new/edit forms, the current value is shown broken down as text up to `GP` (e.g. "12 GP, 5 SP and 3 CP"), the same way it is already shown on the treasure listing/detail page (`/#/treasures/:id`) — `PP` and gems are not included in this collapsed display.
- Clicking the value (or an accompanying edit control) opens a modal, mirroring the money-edit modal already used on PC/NPC forms (`/#/games/:game_slug/pcs/:id/new`, `.../pcs/:id/edit`, `.../npcs/:id/new`, `.../npcs/:id/edit`), but with only `CP`, `SP` and `GP` fields (no `PP` or gems).
- Editing the CP/SP/GP fields and clicking Save recomputes the total raw value, updates the form's in-memory value, and closes the modal.
- Cancelling the modal discards any in-progress edits and leaves the form's value unchanged.

### Affected pages
- `/#/treasures/new`
- `/#/treasures/edit`
- `/#/games/:game_slug/treasures/new`
- `/#/games/:game_slug/treasures/edit`

## Solution
Reuse the existing money-edit modal infrastructure added for PC/NPC forms (`MoneyEditModal` + `MoneyEditModalController`, backed by `MoneyModelRegistry`/`DndMoneyModel`), generalizing it to support the already-defined `treasure` money context (which already restricts denominations to `CP`/`SP`/`GP` with its own cascade threshold) instead of hardcoding the `character` context. Reuse the existing `TreasureMoney` display component (already used on the treasure listing/detail pages) for the collapsed value display shown before the modal opens, keeping it visually consistent with `/#/treasures/:id`.

## Benefits
- Consistent value-editing UX across PC, NPC and treasure forms.
- Easier to compose/adjust a treasure's value by denomination instead of guessing a raw copper total.
