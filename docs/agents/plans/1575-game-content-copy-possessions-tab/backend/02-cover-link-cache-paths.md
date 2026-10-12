# Cover link finalize cache paths

A cover link's finalize must send the same `X-Cache-Clear` as the copy `201`.

In `backend/staff/copy_links.py`:
- add `_possession_photo_cache_paths(row, upload)`, returning `possessions_copy_cache_paths(row.game_possession)`;
- pass it as `cache_paths=` to the existing `CoverCopyLink(GamePossessionPhoto, 'game_possession')` entry, the same way `_item_photo_cache_paths` is passed.

The finalize sets the copy's `photo` FK through the existing `CopyLinkFinalizer` path. `_set_possession_photo` does not run.

## Files to Change
- `backend/staff/copy_links.py` — add the possession hook and wire it into the registry entry.
