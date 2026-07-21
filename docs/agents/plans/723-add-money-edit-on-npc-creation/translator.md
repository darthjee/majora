# Translator Plan: Add money edit on NPC creation

Main plan: [plan.md](plan.md)

## Shared contracts

Add/update these keys under `game_npc_new_page` in both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, so the frontend agent's `CharacterMoneyField` wiring resolves correctly:

- `edit_money_button` — new key.
  - en: `Edit money`
  - pt: `Editar dinheiro`
- `money_label` — update existing value (drop the parenthetical denomination hint, matching `npc_edit_page.money_label`'s plain wording).
  - en: `Money (copper pieces)` → `Money`
  - pt: `Dinheiro` → unchanged (no parenthetical already present)

## Implementation Steps

### Step 1 — Update `en.yaml`

In `frontend/assets/i18n/en.yaml`, under the `game_npc_new_page:` block (currently around line 501):
- Change `money_label: Money (copper pieces)` to `money_label: Money`.
- Add `edit_money_button: Edit money` (e.g. right after `money_label`, before `submit`).

### Step 2 — Update `pt.yaml`

In `frontend/assets/i18n/pt.yaml`, under the `game_npc_new_page:` block (currently around line 501):
- Leave `money_label: Dinheiro` unchanged.
- Add `edit_money_button: Editar dinheiro` (same position as in `en.yaml`, right after `money_label`).

### Step 3 — Verify key parity

Run `npm run check_i18n` from `frontend/` to confirm every locale file still has the exact same key set.

## Files to Change

- `frontend/assets/i18n/en.yaml` — update `game_npc_new_page.money_label`, add `game_npc_new_page.edit_money_button`.
- `frontend/assets/i18n/pt.yaml` — add `game_npc_new_page.edit_money_button`.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Only the `game_npc_new_page` namespace is touched — no other page's translations change.
- The frontend agent's `GameNpcNewHelper.jsx` change depends on these two keys existing; coordinate ordering (or have the frontend agent add them itself if this agent hasn't run yet) so `npm run check_i18n` and the Jasmine specs both pass.
