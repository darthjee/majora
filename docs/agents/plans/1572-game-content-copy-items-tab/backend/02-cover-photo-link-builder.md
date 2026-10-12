# Cover-photo link builder
A reusable helper that, given a source cover photo row, the copy owner, the target path builder
and the requesting user, returns nothing when the source cover is missing or not `ready`, else:

1. creates the copy photo row (same model, owner FK = the copy, `ready=False`, `path` = the new
   path);
2. creates one `Upload` with `origin=ORIGIN_COPY`, `status=pending`, `upload_type=image`,
   `user=request.user`, `source_path=<source row path>`, `file_path=<new path>`,
   `is_cover=True`, generic `content_object` = the new photo row;
3. returns the `Upload`.

The new path uses `uploads.photo_path.PhotoPathBuilder(segments, f'photo{ext}', use_uuid=False)
.build(root='photos')`, `ext` taken from the source path (`os.path.splitext`). Segments are passed
in by the caller (for items: `['games', target.game_slug, 'items', copy.id]`), so the copy must be
saved before the path is built. Keep it general enough for common items, possessions and factions
(same shape, different owner field/segment); gallery/file variants are left to their tabs.

Tests: link created at the expected path and extension with every `Upload` field; no row/link for
no photo or a not-ready cover; paths never derived from request data.

## Files to Change
- `backend/staff/copy_photo_links.py` (new) — the builder.
- `backend/staff/tests/copy_photo_links_test.py` (new) — its unit tests.
