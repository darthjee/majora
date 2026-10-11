# POST staff/copies/links/<upload_id>/renew.json

Add the view `staff/views/staff_copy_link_renew.py` (`staff_copy_link_renew`). It uses `@restricted`, `POST`, `AllowAny` and an inline `require_staff` **before** `<upload_id>` is resolved.

- Look up the upload with `Upload.objects.select_for_update().filter(pk=upload_id, origin=copy).first()` inside `transaction.atomic()`. If none is found (missing, regular or staff), return `404`. Staff can never take over a non-copy token.
- `409` when `status == uploaded`, or when `status == uploading` and it has not expired (a link in flight).
- Otherwise (pending, failed, or expired uploading), call `upload.renew(request.user)` (step 01) and return `200 {upload_id, upload_type, token}`, with no paths.

Register `path('staff/copies/links/<int:upload_id>/renew.json', ...)` before the generic copy-type routes, and export the view.

Tests (`backend/staff/tests/staff_copy_link_renew_test.py`):
- `401`/`403` for a missing id too;
- `404` for a regular, staff or missing upload;
- `409` for uploaded, and for uploading that has not expired;
- success from pending, from failed (error cleared) and from expired uploading;
- the old token stops working on `PATCH`, and the new one works;
- the user is reassigned to the renewing staff member, so another staff member can resume;
- the response has no `file_path`/`source_path`;
- `returns_skip_cache_header`.

## Files to Change
- `backend/staff/views/staff_copy_link_renew.py` — new view.
- `backend/staff/views/__init__.py` — export.
- `backend/staff/urls.py` — route.
- `backend/staff/tests/staff_copy_link_renew_test.py` — new tests.
