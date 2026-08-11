# Translator Plan: Fixes to miniatures

Main plan: [plan.md](plan.md)

## Shared contracts

You must produce (consumed by `frontend`, see [plan.md](plan.md)'s "Shared contracts") — these
exact keys, in every existing locale directory under `frontend/assets/i18n/<lang>/`:

- `common.yaml` → `header:` namespace → `nav_miniatures`
- `collection_new_page.yaml` → `source_label`, `source_search_placeholder`
- `stl_model_new_page.yaml` → `remove_tag_tooltip`, `sources_label`, `sources_search_placeholder`,
  `collections_label`, `collections_search_placeholder`
- `stl_model_page.yaml` → `collections`

Do not touch any `.jsx`/`.js` file — `frontend` owns every `Translator.t(...)` call site.

## Implementation Steps

### Step 1 — `common.yaml`: `header.nav_miniatures`

Add `nav_miniatures` to the existing `header:` namespace in every language's `common.yaml`,
right alongside the existing `nav_stl_models`/`nav_sources`/`nav_collections` keys. English copy:
`Miniatures`.

### Step 2 — `collection_new_page.yaml`: source picker labels

Add two new keys to the existing `collection_new_page:` namespace in every language:
- `source_label`: `Source`
- `source_search_placeholder`: `Search sources...` (mirror the `search_placeholder: Search
  treasures...`/`Search characters...` phrasing convention already used by `give_item_modal`'s
  namespace in `common.yaml`)

### Step 3 — `stl_model_new_page.yaml`: tag-removal + source/collection picker labels

Add five new keys to the existing `stl_model_new_page:` namespace in every language:
- `remove_tag_tooltip`: `Remove tag`
- `sources_label`: `Sources`
- `sources_search_placeholder`: `Search sources...`
- `collections_label`: `Collections`
- `collections_search_placeholder`: `Search collections...`

### Step 4 — `stl_model_page.yaml`: collections heading

Add one new key to the existing `stl_model_page:` namespace in every language, alongside the
existing `sources: Sources` key:
- `collections`: `Collections`

### Step 5 — Verify

Run the translation-sync check (fails loudly on any missing/extra key per language, mismatched
namespace-to-file mapping, or duplicate namespace):

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Fix any reported mismatch before considering the task done.

## Files to Change

- `frontend/assets/i18n/<lang>/common.yaml` — every language directory, `header.nav_miniatures`
- `frontend/assets/i18n/<lang>/collection_new_page.yaml` — every language directory
- `frontend/assets/i18n/<lang>/stl_model_new_page.yaml` — every language directory
- `frontend/assets/i18n/<lang>/stl_model_page.yaml` — every language directory

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Non-English locales' copy is a real translation of the English text above, not a placeholder —
  follow the same standard already applied to every other key in these files.
- Coordinate key names exactly as listed — `frontend`'s `Translator.t(...)` call sites are written
  against these specific key strings.
