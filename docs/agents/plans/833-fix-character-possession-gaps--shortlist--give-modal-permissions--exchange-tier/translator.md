# Translator Plan: Fix character possession gaps: shortlist, give-modal permissions, exchange tier

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's Step 1/Step 3 (see [frontend.md](frontend.md)) reference two keys this work must produce: `character_page.possessions_title` and `character_possessions_preview.empty`. Neither side depends on landing first — the frontend code can reference these key names before they exist without breaking (missing keys just render the raw key/fallback in dev).

## Implementation Steps

### Step 1 — Add `possessions_title` under `character_page` in `common.yaml`

`frontend/assets/i18n/en/common.yaml` and `frontend/assets/i18n/pt/common.yaml` both have a `character_page:` block with `treasures_title` / `items_title` / `documents_title` / `photos_title`. Add `possessions_title` immediately after `documents_title` in both files:

- `en/common.yaml`: `possessions_title: Possessions`
- `pt/common.yaml`: add the Portuguese equivalent, matching the existing translation style/tone already used for `documents_title` in that file (read the current pt value first rather than guessing a literal translation).

### Step 2 — Add `character_possessions_preview.yaml` (en + pt)

Mirror `character_documents_preview.yaml`/`character_items_preview.yaml` exactly — a new top-level `character_possessions_preview:` key with a single `empty` string:

- `frontend/assets/i18n/en/character_possessions_preview.yaml`:
  ```yaml
  character_possessions_preview:
    empty: No possessions yet.
  ```
- `frontend/assets/i18n/pt/character_possessions_preview.yaml`: same key, translated to match the tone of the existing `character_documents_preview.yaml`/`character_items_preview.yaml` pt translations.

### Step 3 — Verify key sync

Run the translation-sync check to confirm every key added above exists in both `en` and `pt` with no orphans.

## Files to Change

- `frontend/assets/i18n/en/common.yaml` — add `character_page.possessions_title`.
- `frontend/assets/i18n/pt/common.yaml` — add `character_page.possessions_title`.
- `frontend/assets/i18n/en/character_possessions_preview.yaml` — new file.
- `frontend/assets/i18n/pt/character_possessions_preview.yaml` — new file.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — verifies translation keys stay in sync across `en`/`pt`.

## Notes

- No English-copy decisions needed beyond the `possessions_title`/`empty` strings above — both are short, low-ambiguity labels following an exact existing pattern (three sibling resources already have the identical two keys).
