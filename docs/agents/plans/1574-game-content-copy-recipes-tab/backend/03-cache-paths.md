# Cache paths

The copy `201` sends `X-Cache-Clear` (every domain, via `attach_cache_clear`) with:

- the recipe family of the copy: `GameResourceCachePaths('recipes', **FULL_FAMILY)` →
  `/games/<target>/recipes.json`, `/recipes/all.json`, `/recipes/<copy-id>.json`,
  `/recipes/<copy-id>/full.json`;
- the resolved common item's nested lists (reused **or** copied):
  `/games/<target>/common_items/<ci-id>/recipes.json` and `.../recipes/all.json`;
- only when the common item was copied: `common_items_copy_cache_paths(common_item)`.

Not cleared: `/recipes/<copy-id>/characters*.json` and the characters'
`recipes/available*.json` (always `X-Skip-Cache`). The cover link finalize already clears the
common item family through the existing `game_common_item` copy-link entry; no change to
`copy_links.py` is needed.

Add a `recipes_copy_cache_paths(recipe)` (and the nested-list helper) to `copy_cache_paths.py`
next to the existing helpers.

## Files to Change
- `backend/staff/copy_cache_paths.py` — recipe family + common item nested recipe list paths.
- `backend/staff/copy_types_recipes.py` — combine them per reuse/copy case.
