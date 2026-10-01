# Deletable and delete endpoints

Consumed by the proxy delete orchestration (#1472), same contract as the character-photo flow.

- `GET /staff/photos/<str:photo_type>/<int:photo_id>/deletable.json` (`staff_photo_deletable`): `require_staff` first; 404 unknown slug/id; active upload → **422** (no body); else **200** `{"deletable": true, "path": photo.path}`. Ready photos are deletable (unlike the character-photo check).
- `DELETE /staff/photos/<str:photo_type>/<int:photo_id>.json` (`staff_photo_delete`): `require_staff` first; 404 unknown; active upload → 422 (defensive, same rule); in a transaction: for gallery entries whose owner's `photo_id == photo.id`, set `owner.photo = entry.fallback_photo(owner, excluding=photo)` (most recent ready sibling or `None`) and save; delete the photo row (non-gallery owners get `NULL` via `SET_NULL`); respond **204**.
- Both: `@restricted` + `AllowAny` + inline `require_staff`. Since both views share a URL prefix but differ by suffix, they're separate routes; `DELETE` uses the `<photo_id>.json` route.

Tests: 401/403 before resolution, 404 cases, 200 body (parametrized over registry), 422 with active upload / 200 with expired one, DELETE happy path per type (row gone, owner FK cleared), gallery fallback (ready sibling picked by highest id, not-ready sibling ignored, none → NULL, deleting a non-current gallery photo leaves owner unchanged), `X-Skip-Cache: true`.

## Files to Change

- `backend/staff/views/staff_photo_deletable.py`, `backend/staff/views/staff_photo_delete.py` — new views.
- `backend/staff/photo_types.py` — use the gallery helpers from step 02 (adjust if needed).
- `backend/staff/views/__init__.py`, `backend/staff/urls.py` — wiring.
- `backend/staff/tests/staff_photo_deletable_test.py`, `backend/staff/tests/staff_photo_delete_test.py` — tests.
