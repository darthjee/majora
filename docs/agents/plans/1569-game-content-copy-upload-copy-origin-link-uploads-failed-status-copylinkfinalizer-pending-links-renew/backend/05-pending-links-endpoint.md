# GET staff/copies/links.json

Add the view `staff/views/staff_copy_links.py` (`staff_copy_links`). It uses `@restricted`, `GET`, `AllowAny` and an inline `require_staff` **first**, the same pattern as `staff_copies_games`.

1. Resolve `to` with `GameSlugResolver` (`_staff_copy_shared.py`). A missing, invalid or unknown slug returns `400 {'errors': {'to': [...]}}`.
2. Build the query in a small, testable helper (e.g. `staff/copy_link_query.py` or a function in `copy_links.py`). For each `CopyLink` entry, select `Upload.objects.filter(origin=copy, content_type=<entry model>, object_id__in=entry.object_ids_in(to_game)).exclude(status=uploaded)`.
   - Do **not** use `active()`: failed and expired uploads are included.
   - Uploads whose content object is gone drop out naturally, because `object_ids_in` only yields existing rows.
   - Order by upload id.
3. Serialize each link with a new `StaffCopyLinkSerializer` (`staff/serializers/staff_copy_link.py`) into:
   - `upload_id`, `upload_type`, `status`, `error`;
   - `entity`: the `photo_type.describe_owner(owner)` of the copied row (`{type, id, name, kind, game}`).

   Never include `file_path`, `source_path`, `token` or `user`. Load owners in a batch per type (`photo_type.load_owners`) to avoid N+1 queries.
4. Return an unpaginated bare JSON list, matching `staff_copies_games`. #1571 consumes this shape.

Register `path('staff/copies/links.json', ...)` in `staff/urls.py` **before** the generic `<str:copy_type>` routes, next to `games.json`, and export the view from `staff/views/__init__.py`.

Tests (`backend/staff/tests/staff_copy_links_test.py`):
- `401`/`403` before slug resolution (with an unknown `to` too);
- `400` for a missing or unknown `to`;
- pending, uploading, failed and expired copy uploads are listed, with their `error`;
- `uploaded`, regular and staff uploads, other games' uploads, and orphaned uploads are excluded;
- one case per model, including `GameDocumentFilePhoto`;
- no path, token or user fields in the payload;
- `returns_skip_cache_header`.

## Files to Change
- `backend/staff/views/staff_copy_links.py` — new view.
- `backend/staff/views/__init__.py` — export.
- `backend/staff/urls.py` — route before the generic copy-type routes.
- `backend/staff/serializers/staff_copy_link.py` and `backend/staff/serializers/__init__.py` — serializer.
- `backend/staff/copy_links.py` — pending-links query helper, if placed there.
- `backend/staff/tests/staff_copy_links_test.py` — new tests.
