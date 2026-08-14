# Translator Plan: Add filters to /#/miniatures/stl_models

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's `StlModelFilters`/`StlModelFiltersHelper` (see [frontend.md](frontend.md)) will call `Translator.t()` for every label/placeholder/button below, under the existing `stl_models_page` namespace (`frontend/assets/i18n/<lang>/stl_models_page.yaml`) — the same namespace file `stlModelListType.js`'s page already uses for `loading`/`new_stl_model`. The `type_<value>`/`race_<value>`/`role_<value>`/`size_<value>` option labels are already covered by the existing `stl_model_page` namespace (no new keys needed there).

## Implementation Steps

### Step 1 — Add new keys to `stl_models_page` in every language

Add these keys under the existing `stl_models_page:` top-level key in both `frontend/assets/i18n/en/stl_models_page.yaml` and `frontend/assets/i18n/pt/stl_models_page.yaml` (same key set, translated content per language — mirror the naming already used for `treasures_page`'s filter keys and `stl_model_new_page`'s picker/tags keys):

```yaml
filter_name_label: Name
filter_name_placeholder: Search by name...
filter_type_label: Type
filter_type_none_option: Any
filter_race_label: Races
filter_race_search_placeholder: Search races...
filter_roles_label: Roles
filter_roles_search_placeholder: Search roles...
filter_source_label: Sources
filter_source_search_placeholder: Search sources...
filter_collection_label: Collections
filter_collection_search_placeholder: Search collections...
filter_tags_label: Tags
filter_tags_placeholder: Type a tag and press Enter, or separate multiple with commas
filter_add_tag: Add
filter_remove_tag_tooltip: Remove tag
filter_size_label: Size
filter_size_none_option: Any
filter_remove_label: Remove
filter_query: Query
filter_clear: Clear
```

Use `pt` translations consistent with this file's existing `pt/stl_models_page.yaml`/`pt/stl_model_new_page.yaml`/`pt/treasures_page.yaml` tone and terminology (reuse the same Portuguese wording already used for `races_label`/`roles_label`/`tags_label`/`sources_label`/`collections_label` etc. in `pt/stl_model_new_page.yaml`, and for `filter_query`/`filter_clear` in `pt/treasures_page.yaml`).

Exact final key names are the frontend agent's call once `StlModelFiltersHelper.jsx` is written (e.g. it may reuse `MultiResourcePickerField`'s `removeLabel` prop once per field rather than one shared `filter_remove_label` — coordinate on the actual `Translator.t()` call sites rather than treating this list as frozen).

### Step 2 — Verify sync

Run `npm run check_i18n` to confirm every language directory still has an identical namespace-to-file/key mapping.

## Files to Change

- `frontend/assets/i18n/en/stl_models_page.yaml` — new `filter_*` keys.
- `frontend/assets/i18n/pt/stl_models_page.yaml` — same keys, Portuguese translations.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No new namespace file or `index.js` manifest changes needed — `stl_models_page.yaml` already exists in both language directories and is already registered.
- Depends on the frontend agent's `StlModelFiltersHelper.jsx` for the exact set/names of `Translator.t()` calls it ends up making; this list is a strong starting point, not a contract to match byte-for-byte.
