# Cover link finalize cache paths

In `backend/staff/copy_links.py`, add `_faction_photo_cache_paths(row, upload)` returning
`factions_copy_cache_paths(row.faction)` and pass it as `cache_paths=` to the existing
`CoverCopyLink(GameFactionPhoto, 'faction')` entry, so the cover finalize sends the same
`X-Cache-Clear` paths as the copy `201`. The pending-links query already reaches the game through
`faction__game`; keep it.

## Files to Change
- `backend/staff/copy_links.py` — faction cover finalize cache paths
