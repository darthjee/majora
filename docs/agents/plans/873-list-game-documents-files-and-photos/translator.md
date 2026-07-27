# Translator Plan: List game document files and photos

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent references the keys below (see [plan.md](plan.md)'s shared contracts table). Add them to every locale file under `frontend/assets/i18n/` with equivalent, natural-language values per locale — do not just copy the English string into other locales.

## Implementation Steps

### Step 1 — Add the new namespaces/keys to every locale file

Following the pattern already used for `document_page`, `character_photos_preview`, and `game_documents_page` in `frontend/assets/i18n/en.yaml`:

```yaml
document_page:
  loading: Loading document...
  hidden_label: Hidden
  photos_title: Photos       # new
  files_title: Files         # new

game_document_photos_preview:
  empty: No photos yet.      # new namespace

game_document_files_preview:
  empty: No files yet.       # new namespace

game_document_photos_page:
  title: Photos               # new namespace
  loading: Loading photos...

game_document_files_page:
  title: Files                 # new namespace
  loading: Loading files...
```

(`document_page` already exists in `en.yaml` around line 473 — add `photos_title`/`files_title` to the existing block rather than duplicating it.)

Do **not** add a new key for the "See more" card text — `character_preview_section.see_all` (`"See all {{title}}"`) is already generic and gets reused as-is by the new photo/file "See more" cards.

### Step 2 — Verify key parity

Run the check script and fix any reported mismatch.

## Files to Change
- `frontend/assets/i18n/en.yaml` — add the new keys (source of truth for wording).
- `frontend/assets/i18n/*.yaml` (every other locale) — add the same keys, translated.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`).

## Notes
- Wait for the `frontend` agent to confirm the final key names before finalizing wording, in case it needs to deviate from the names proposed in [plan.md](plan.md) — but the names there already follow this project's existing `<page>_page.<field>` / `<resource>_preview.empty` conventions closely enough that no change is expected.
