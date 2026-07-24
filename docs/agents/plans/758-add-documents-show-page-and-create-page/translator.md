# Translator Plan: Add documents show page and create page

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent's new components (Step 4–6 of [frontend.md](frontend.md)) call `Translator.t(...)` with the exact keys below — add them under both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` (Portuguese translations, matching the existing tone/register of neighboring `item_new_page`/`game_items_page` entries in `pt.yaml`), or `npm run check_i18n` will fail in CI.

## Implementation Steps

### Step 1 — `game_documents_page.create_document`

Add one key to the existing `game_documents_page` namespace (both `en.yaml` and `pt.yaml`), mirroring `game_items_page.create_item`:

```yaml
game_documents_page:
  loading: Loading documents...
  title: Documents
  hidden_label: Hidden
  create_document: Create Document
```

### Step 2 — New `document_new_page` namespace

Mirror `item_new_page`, but drop every photo-upload-related key (`photo_upload_failed`, `retry_photo_upload`, `skip_photo_upload`) since document creation has no photo upload in this issue:

```yaml
document_new_page:
  title: Create Document
  name_label: Name
  description_label: Description
  hidden_label: Hidden
  submit: Create Document
  error: Failed to create document. Please try again.
```

### Step 3 — New `document_page` namespace (show page)

Mirror `item_page` (used for loading/hidden-label strings on the item show page):

```yaml
document_page:
  loading: Loading document...
  hidden_label: Hidden
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_documents_page.create_document`, `document_new_page`, `document_page`
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese translations

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — verifies every key present in `en.yaml` is also present in `pt.yaml` (and vice versa)

## Notes

- Confirm the exact key names the `frontend` agent's components end up calling (this plan specifies them precisely so both sides agree in advance — do not rename without updating [frontend.md](frontend.md)).
- If the `frontend` agent lands first and needs a build to pass locally, these keys can be stubbed with English text in `pt.yaml` initially, but should carry real Portuguese translations before merge — check with the `pt.yaml` maintainer/existing translation style for tone.
