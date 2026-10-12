# Common item cache paths and copy link hook

Add `common_items_copy_cache_paths(common_item)` to `copy_cache_paths.py`, returning
`photo_types.find('game_common_item').cache_paths(common_item)`. That is the existing
`GameResourceCachePaths('common_items', **FULL_FAMILY)` family: `/games/<target>/common_items.json`,
`/common_items/all.json`, `/common_items/<copy-id>.json`, `/common_items/<copy-id>/full.json`.
No `available.json` paths, and no `recipes*.json` paths.

In `copy_links.py`, add `_common_item_photo_cache_paths(row, upload)` returning
`common_items_copy_cache_paths(row.game_common_item)`, and pass it as `cache_paths=` to the
existing `CoverCopyLink(GameCommonItemPhoto, 'game_common_item')` entry, so the link finalize
sends the same `X-Cache-Clear` paths as the copy `201`. The pending-links reach
(`game_common_item__game`) and `set_cover` already come from `CoverCopyLink`.

## Files to Change
- `backend/staff/copy_cache_paths.py` — `common_items_copy_cache_paths`.
- `backend/staff/copy_links.py` — cache-path hook on the `GameCommonItemPhoto` entry.
