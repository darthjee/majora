# Translator Plan: Add miniatures source

Main plan: [plan.md](plan.md)

## Shared contracts

Must define the exact keys [frontend.md](frontend.md) consumes (listed in [plan.md](plan.md)'s
"Shared contracts" section): `sources_page.*`, `source_page.*`, `source_new_page.*`, plus one
new key in the existing `common.yaml`/`header` namespace (`header.nav_sources`). Nothing to
consume from another agent — copy/wording is the translator's own call.

## Implementation Steps

### Step 1 — New namespace files, both languages

Mirror `stl_models_page.yaml`/`stl_model_page.yaml`/`stl_model_new_page.yaml`'s namespace-to-file
mapping exactly, in both `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`:

- `sources_page.yaml`:
  ```yaml
  sources_page:
    loading: Loading sources...
    new_source: New Source
  ```
- `source_page.yaml`:
  ```yaml
  source_page:
    loading: Loading source...
    url: Website
  ```
- `source_new_page.yaml`:
  ```yaml
  source_new_page:
    title: New Source
    name_label: Name
    url_label: Url
    submit: Create Source
    error: Failed to create source. Please try again.
    photo_upload_failed: Failed to upload the photo. The source was created — you can retry the upload or skip it for now.
    retry_photo_upload: Retry photo upload
    skip_photo_upload: Skip and continue
  ```
  (English copy shown; write the `pt` equivalents in Portuguese, following the tone of the
  existing `stl_model_new_page.yaml`'s `pt` translation.)

Register each new file in both languages' `index.js` manifest (one `?raw` import + export line
per file, per [docs/agents/i18n.md](../../i18n.md)'s layout).

### Step 2 — `header.nav_sources`

Add `nav_sources: Sources` (and the `pt` equivalent) to the `header:` namespace inside
`common.yaml`, both languages — needed for [frontend.md](frontend.md)'s Step 6 nav link addition.

### Step 3 — Verify

Run the check below and fix any reported key/file-mapping mismatch before considering this done.

## Files to Change

- `frontend/assets/i18n/en/sources_page.yaml` — new
- `frontend/assets/i18n/en/source_page.yaml` — new
- `frontend/assets/i18n/en/source_new_page.yaml` — new
- `frontend/assets/i18n/en/common.yaml` — add `header.nav_sources`
- `frontend/assets/i18n/en/index.js` — register the three new files
- `frontend/assets/i18n/pt/sources_page.yaml` — new
- `frontend/assets/i18n/pt/source_page.yaml` — new
- `frontend/assets/i18n/pt/source_new_page.yaml` — new
- `frontend/assets/i18n/pt/common.yaml` — add `header.nav_sources`
- `frontend/assets/i18n/pt/index.js` — register the three new files

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (also covered by the
  `frontend-checks` CI job alongside `npm run lint`)

## Notes

- Exact English/Portuguese copy above is a starting draft — refine wording at implementation
  time as long as the key names stay exactly as listed in [plan.md](plan.md)'s shared contracts.
