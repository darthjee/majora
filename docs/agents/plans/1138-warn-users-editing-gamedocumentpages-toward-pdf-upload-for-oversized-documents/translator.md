# Translator Plan: Warn users editing GameDocumentPages toward PDF upload for oversized documents

Main plan: [plan.md](plan.md)

## Shared contracts

- Frontend will reference the i18n key `document_edit_page.pages_count_warning_hint` (no
  placeholders) as the `title`/accessible label on the warning-styled page-count link. This key
  must exist, with matching content intent, in every locale.

## Implementation Steps

### Step 1 — Add the new key to every locale

Add `pages_count_warning_hint` under the existing `document_edit_page:` block in every
`frontend/assets/i18n/<lang>/document_edit_page.yaml` (currently `en` and `pt`; check for any
locale added since):

- `en`: `This document is getting large — consider uploading it as a PDF instead.`
- `pt`: a natural Portuguese translation of the same guidance (not a literal word-for-word
  translation — match this file's existing tone, e.g. `pages_save_failed`'s phrasing style).

### Step 2 — Verify key parity

Run `npm run check_i18n` (from `frontend/`) to confirm the new key is present and consistent
across all locales — this is the same check CI's `frontend-checks` job runs.

## Files to Change

- `frontend/assets/i18n/en/document_edit_page.yaml` — add `pages_count_warning_hint`.
- `frontend/assets/i18n/pt/document_edit_page.yaml` — add `pages_count_warning_hint`.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Coordinate merge/commit order with the frontend agent's work (or land in the same PR) — CI's
  `check_i18n`/lint will fail if either side lands without the other.
