# Issue: Add money edit on NPC creation

## Description
On the NPC creation page (`/#/games/:game_slug/npcs/new`), NPC money is currently entered via a raw numeric `FormField` below the two-column layout (see `GameNpcNewHelper.jsx`). The NPC edit page already displays and edits money through `CharacterMoneyField` (a money breakdown display + "Edit money" button, rendered in the left `col-md-4` column by `BaseCharacterEditHelper.jsx`, right after the links field) plus `MoneyEditModal`. On the edit pages (`CharacterEdit.jsx`, shared by NPC and PC), confirming the modal only updates local form state — no request is made. NPC creation should reuse this same display + modal pattern, in the same left-column position, instead of the raw number input below the columns.

## Problem
The raw number input on NPC creation is inconsistent with how money is displayed and edited everywhere else in the app (NPC/PC edit and show pages), and doesn't let the game master set a starting money breakdown — only a single raw total.

## Expected Behavior
- The NPC creation page displays money using `CharacterMoneyField`, broken down for the game's type, with `treasureValue` fixed at `0` (no treasure exists yet for a not-yet-created NPC).
- The money field is positioned in the left column (`col-md-4`), matching its position on the NPC edit page, instead of as a standalone field below the two-column layout.
- Clicking the "Edit money" button opens `MoneyEditModal`, same as the edit page.
- Confirming the modal updates the money value held in the creation form's local state only — no request is made, matching `CharacterEdit.jsx`'s `onConfirm` behavior.
- The raw numeric money `FormField` is removed.
- Submitting the NPC creation form still sends the accumulated money total in `createNpc`'s payload, unchanged.

## Solution
In `GameNpcNewHelper.jsx`, remove the raw `FormField` money input and add `CharacterMoneyField` (`money={formState.money}`, `treasureValue={0}`, `gameType`, `onOpenMoneyModal`) to `#renderAvatarColumn`, after `CharacterLinksField` — mirroring `BaseCharacterEditHelper.jsx`'s layout. In `GameNpcNew.jsx`, add the modal-visibility state and `MoneyEditModal` wiring the same way `CharacterEdit.jsx` wires it (`onConfirm` sets the `money` field locally via `handleChange`/`setField`, `onClose` hides the modal). `GameNpcNewController.submitForm` keeps sending `parseInt(formValues.money, 10)` unchanged.

## Benefits
Consistent money editing UX across NPC creation, edit, and show pages; game masters get a breakdown-based way to set an NPC's starting money instead of typing a raw total.
