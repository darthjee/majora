# Plan: Add money editor modal

Issue: [498-add-money-editor-modal.md](../../issues/498-add-money-editor-modal.md)

## Overview

Replace the single raw-copper-total input on the PC/NPC edit page with the same
denomination-breakdown display used on the character show page, plus an "Edit money"
button that opens a modal for editing CP/SP/GP/PP/gems individually. The modal follows
the exact Component → Controller → Helper pattern already used by the existing
`LinksEditModal`. A new packing utility class (the inverse of the existing `CoinBreakdown`
unpacking class) is added so the modal can turn its per-denomination inputs back into a
single copper total; both classes are exposed through the existing `DndMoneyModel`
common-interface facade (already resolved via `MoneyModelRegistry` by both the character
and treasure money displays).

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **New i18n namespace `money_edit_modal`** (mirrors the existing `links_edit_modal`
  namespace), with exactly these keys, added to both `frontend/assets/i18n/en.yaml` and
  `frontend/assets/i18n/pt.yaml`:
  - `title` — modal header text (e.g. "Edit money" / "Editar dinheiro")
  - `confirm` — confirm button text (e.g. "Confirm" / "Confirmar")
  - `cancel` — cancel button text (e.g. "Cancel" / "Cancelar")
  The frontend agent calls these via `Translator.t('money_edit_modal.title')` etc. in
  `MoneyEditModalHelper.jsx` — it does not create these keys itself.
- **New key `edit_money_button`** added by the translator agent to both the
  `pc_edit_page` and `npc_edit_page` namespaces in both locale files (alongside the
  existing `edit_links_button` key in each), used by the frontend agent for the new
  "Edit money" button label via `Translator.t(`${i18nNamespace}.edit_money_button`)`.
- **Row labels inside the modal reuse existing keys** — no new keys needed for these:
  `money.copper_piece`, `money.silver_piece`, `money.gold_piece`, `money.platinum_piece`,
  `money.gp_in_gems` (all already present and translated in both locale files, currently
  unused in JS). The frontend agent consumes them as-is; the translator agent does not
  need to touch them.

## Notes

- No backend changes: the character update endpoint already accepts a plain numeric
  `money` field (copper total) and is untouched by this issue — the modal only changes
  how that single number is produced/edited client-side.
