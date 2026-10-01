# Index and list endpoints

- `GET /staff/photos.json` (`staff_photos_index`): `{"max_dimension": Settings.photo_max_dimension(), "types": photo_types.slugs()}`.
- `GET /staff/photos/<str:photo_type>.json` (`staff_photos_list`): `require_staff` **first**, then `find(photo_type)` (unknown → 404); queryset `entry.model.objects.select_related(*entry.select_related).order_by('-id')`; respond via `paginated_list_response` with a list serializer.
- Serializer (`backend/staff/serializers/staff_photo_list.py`): item `{id, path, ready, replace_in_progress, owner}`; `owner` from the per-page `load_owners` map + `describe_owner` (or `null`); `replace_in_progress` from **one** batch active-upload query for the page's ids (content type of `entry.model`). Pass both maps through serializer `context` — compute them after pagination (paginate first, then build context from the page), adapting `paginated_list_response` usage or paginating with `Paginator` directly as `paginated_list_response` does.
- Both views: `@restricted` outermost, `@api_view(['GET'])`, `@permission_classes([AllowAny])` + comment, matching `staff_users_list`.
- URLs in `backend/staff/urls.py`; export views from `backend/staff/views/__init__.py`.

Tests:
- Index: 401 anonymous, 403 non-staff, 200 staff/superuser body; `X-Skip-Cache: true`.
- List, **parametrized over every registry entry**: 401/403 (also for an unknown slug — permission check runs before slug resolution), 404 unknown slug for staff, item shape, newest-first, not-ready rows included, pagination headers, `replace_in_progress` true for active / false for expired uploads.
- Owner edge cases: `owner: null` orphan `GameDocumentFilePhoto`, global treasure `game: null`, PC/NPC `kind`.
- **Query budget:** `django_assert_num_queries` constant for a direct-FK type and for `game_document_file`, independent of row count.

## Files to Change
- `backend/staff/views/staff_photos_index.py`, `backend/staff/views/staff_photos_list.py` — new views.
- `backend/staff/serializers/staff_photo_list.py` (+ `serializers/__init__.py`) — list serializer.
- `backend/staff/views/__init__.py`, `backend/staff/urls.py` — wiring.
- `backend/staff/tests/staff_photos_index_test.py`, `backend/staff/tests/staff_photos_list_test.py` — tests.
