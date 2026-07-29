# Translator Plan: List Character Documents

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<key>')` for every new user-visible string on the
new PC/NPC document show page and will not hardcode English text. Add the corresponding keys to
every existing locale file under `frontend/assets/i18n/` (currently `en.yaml`/`pt.yaml` — check
what's present at implementation time and keep all locale files in sync, per the key-parity check
run by `npm run check_i18n`).

## Implementation Steps

### Step 1 — Add a namespace for the new show page

Following the `namespace.key` convention (one namespace per page, matching `item_page.*`'s use
for the analogous `CharacterItem` show page, shared across game/PC/NPC), add:

```yaml
character_document_page:
  loading: Loading document...
  hidden_label: Hidden
```

Only add `loading`/`hidden_label` for now — there is no `description` field on `CharacterDocument`
(unlike `item_page`, which also backs an edit page with more fields), and no edit/upload action on
this page, so no further keys are anticipated. Coordinate with the `frontend` agent on the exact
key names it ends up referencing in `DocumentDetailHelper.jsx`/`CharacterDocumentDetailController.js`
— if it turns out to need additional keys (e.g. an error message), add them here to match.

### Step 2 — Verify key parity

Run the key-parity check across every locale file after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the `character_document_page` namespace
- Every other locale file present under `frontend/assets/i18n/` at implementation time — same keys

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This is a small addition compared to the backend/frontend work — coordinate timing with the
  `frontend` agent so the exact key names match what `DocumentDetailHelper.jsx` actually calls.
