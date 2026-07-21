# Plan: Add money edit on NPC creation

Issue: [723-add-money-edit-on-npc-creation.md](../../issues/723-add-money-edit-on-npc-creation.md)

## Overview

Replace the raw numeric money `FormField` on the NPC creation page (`GameNpcNewHelper.jsx`) with the same `CharacterMoneyField` + `MoneyEditModal` pattern already used on the NPC/PC edit pages, positioned in the left `col-md-4` column right after the links field. Confirming the modal only updates local form state (no request); the final total is still submitted unchanged. Since the creation page currently has no notion of the game's currency type, it also needs to fetch `game_type`, mirroring the existing `GameTreasureNewController` precedent.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend code will call two i18n keys under the `game_npc_new_page` namespace that the translator must add/update in both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`:

- `game_npc_new_page.edit_money_button` — **new key**. Passed as `CharacterMoneyField`'s `buttonLabel` prop. Value must match the existing `npc_edit_page.edit_money_button` wording:
  - en: `Edit money`
  - pt: `Editar dinheiro`
- `game_npc_new_page.money_label` — **existing key, value changes**. Passed as `CharacterMoneyField`'s `label` prop. The parenthetical denomination hint is dropped (the breakdown display itself now shows denominations), matching `npc_edit_page.money_label`'s plain wording:
  - en: `Money (copper pieces)` → `Money`
  - pt: `Dinheiro` (already has no parenthetical — leave unchanged)

The frontend agent must not merge/commit its work until these exact key names exist in both locale files (or must add them itself if going first — see notes in [frontend.md](frontend.md)).
