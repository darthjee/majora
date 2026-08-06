# Translator Plan: Add give treasures

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the `give_treasure_modal.*` i18n namespace frontend consumes (see [plan.md](plan.md)'s
"Shared contracts" for the exact key list).

## Implementation Steps

### Step 1 — Add `give_treasure_modal` to `frontend/assets/i18n/en.yaml`

Copy `give_item_modal`'s block (`frontend/assets/i18n/en.yaml`, currently starting at line 445)
key-for-key, renaming `item`→`treasure` in the English copy, plus two additions for the
availability-pool cap (reusing existing wording from `treasure_exchange_modal`, lines ~426-427):

```yaml
give_treasure_modal:
  title: Give Treasure
  pc_tab: PCs
  npc_tab: NPCs
  search_placeholder: Search characters...
  cancel: Cancel
  clear: Clear
  submit: Submit
  owned_quantity_tooltip: How many of this treasure the character already owns
  pending_quantity_tooltip: How many units will be given to this character
  increment_tooltip: Increase the quantity to give
  decrement_tooltip: Decrease the quantity to give
  remove_character_tooltip: Remove this character from the list
  loading: Loading characters...
  load_error: Unable to load characters. Please try again.
  result_success: 'Treasure given to {{name}}.'
  result_failure: 'Unable to give treasure to {{name}}.'
  remaining_units: '{{remaining}} left to give'
  partially_fulfilled: 'Only {{acquired}} of {{requested}} were available and were given to {{name}}.'
```

### Step 2 — Mirror the same block into `frontend/assets/i18n/pt.yaml`

Translate every value to Portuguese, matching the existing `give_item_modal`/
`treasure_exchange_modal` blocks' tone and terminology already used there (reuse `pt.yaml`'s
existing translations for the shared item-derived strings — search-and-adapt rather than
translating from scratch, to stay consistent with house terminology for "give"/"quantity"/
"character").

### Step 3 — Verify sync

Run the translation-sync check locally to confirm both files stay key-for-key identical.

## Files to Change

- `frontend/assets/i18n/en.yaml` — new `give_treasure_modal` block
- `frontend/assets/i18n/pt.yaml` — new `give_treasure_modal` block (pt translation)

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Keep key names identical across both files (the check_i18n script enforces this) — only values
  differ.
