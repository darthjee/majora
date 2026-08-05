# Translator Plan: Add give item option

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent defines the exact key names under a new `give_item_modal` namespace while
building `GiveItemModalHelper.jsx`/its row helpers (see [frontend.md](frontend.md)'s "Files to
Change"). This plan's job is to add those same key names — do not invent different names or
restructure the namespace; if a key the frontend agent needs is missing here, add it under this
same namespace rather than a new one.

## Implementation Steps

### Step 1 — Add the `give_item_modal` namespace

Add a new top-level `give_item_modal:` block to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, mirroring the structure and tone of the existing
`item_exchange_modal` namespace (`en.yaml:423-438`). At minimum, cover:

- `title` — modal heading (e.g. "Give Item").
- `pc_tab` / `npc_tab` — left-side tab labels.
- `search_placeholder` — search box placeholder (compare `item_exchange_modal.search_placeholder`,
  `en.yaml:425`).
- `cancel` / `clear` / `submit` — bottom button labels.
- `owned_quantity_tooltip` — tooltip for the "already owned" count on a right-side row.
- `pending_quantity_tooltip` — tooltip for the "will create" count on a right-side row.
- `increment_tooltip` / `decrement_tooltip` — tooltips for the caret icons.
- `remove_character_tooltip` — tooltip for the `bi-person-x` icon.
- `loading` / `load_error` — list-loading states (compare `item_exchange_modal.loading`/
  `load_error`, `en.yaml:435-437`).
- A result-summary message for the per-character submit outcome (success and failure cases) —
  coordinate the exact key name with whatever the frontend agent's `GiveItemModalController.js`
  ends up referencing, since it wasn't fully pinned down at plan time.

Write natural English text for `en.yaml` and natural Portuguese for `pt.yaml` (not literal
translations word-for-word) — match the register of neighboring `*_exchange_modal` entries in
each file.

### Step 2 — Verify sync

Run the project's translation-sync check locally before considering this done (see CI Checks
below) to confirm every key added to `en.yaml` has a matching key in `pt.yaml` and vice versa.

## Files to Change

- `frontend/assets/i18n/en.yaml` — new `give_item_modal` namespace.
- `frontend/assets/i18n/pt.yaml` — new `give_item_modal` namespace (same keys, Portuguese text).

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — the authoritative check that both
  locale files declare the same key set.

## Notes

- This plan's key list is a starting point, not final — the frontend agent may need one or two
  additional keys once `GiveItemModalHelper.jsx` is actually built (e.g. a distinct message for
  "partially failed" vs. "all failed" submit outcomes). Add whatever the frontend agent's code
  actually references under the same `give_item_modal` namespace rather than guessing all of them
  upfront.
