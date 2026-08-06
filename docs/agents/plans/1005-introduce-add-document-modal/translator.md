# Translator Plan: Introduce Add document modal

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the `give_document_modal.*` i18n namespace consumed by
[frontend.md](frontend.md)'s `GiveDocumentModalHelper.jsx`/`DocumentReceivingRowHelper.jsx` via
`Translator.t('give_document_modal.<key>')`.

## Implementation Steps

### Step 1 — Add `give_document_modal` to `frontend/assets/i18n/en.yaml`

Mirror the existing `give_treasure_modal` block (around line 462), dropping every
quantity-specific key (`owned_quantity_tooltip`, `pending_quantity_tooltip`,
`increment_tooltip`, `decrement_tooltip`, `remaining_units`, `partially_fulfilled` — no
equivalent for boolean ownership) and adding one new key for the grayed-out/disabled state:

```yaml
give_document_modal:
  title: Give Document
  pc_tab: PCs
  npc_tab: NPCs
  search_placeholder: Search characters...
  cancel: Cancel
  clear: Clear
  submit: Submit
  already_owned_tooltip: This character already owns this document
  remove_character_tooltip: Remove this character from the list
  loading: Loading characters...
  load_error: Unable to load characters. Please try again.
  result_success: 'Document given to {{name}}.'
  result_failure: 'Unable to give document to {{name}}.'
```

Place it near the other `document_exchange_modal`/document-related entries for discoverability,
or directly after `give_treasure_modal` to keep the three "Give X" blocks adjacent — either is
fine, `check_i18n` only cares about key parity across languages, not ordering.

### Step 2 — Add the matching block to `frontend/assets/i18n/pt.yaml`

Same key set, translated to Portuguese, following whatever tone/register the existing
`give_treasure_modal`/`document_exchange_modal` Portuguese entries already use in that file.

### Step 3 — Verify key parity

Run the translation-sync check locally before handing back:

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — new `give_document_modal` block, Step 1
- `frontend/assets/i18n/pt.yaml` — new `give_document_modal` block, Step 2

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- `already_owned_tooltip` is new (no treasure/item precedent) — worded to explain why a receiving
  row is grayed out and unclickable, shown as its tooltip per `frontend.md`'s
  `DocumentReceivingRowHelper` step.
