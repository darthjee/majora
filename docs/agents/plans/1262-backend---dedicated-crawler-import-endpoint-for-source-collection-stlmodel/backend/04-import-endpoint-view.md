# Import endpoint view and URL

Add the view and URL wiring for `POST /miniatures/stl_models/import.json`, following the
existing `stl_models_list`/`urls/stl_models.py` pattern: `@api_view(['POST'])`, `require_staff`
gate (same `user.is_staff or user.is_superuser` check every other miniatures write endpoint
uses), `StlModelImportSerializer` validation via `validated_or_error`, `skip_cache` on every
response, `StlModelDetailSerializer` for the 201/200 response body (full `StlModel` detail, same
shape as the existing create/detail endpoints).

Auth is the DRF-wide default (`CookieTokenAuthentication`, `Authorization: Token <key>`) — no
per-view authentication class needed, matching every other miniatures endpoint.

## Files to Change

- `backend/miniatures/views/stl_model_import.py` (new) — the view function, staff-gated,
  delegating to `StlModelImportSerializer` and returning `StlModelDetailSerializer` output.
- `backend/miniatures/views/__init__.py` — export the new view.
- `backend/miniatures/urls/stl_models.py` — add `path('miniatures/stl_models/import.json',
  views.stl_model_import, name='miniatures-import')`.
- `backend/miniatures/serializers/__init__.py` — export `StlModelImportSerializer`.
- `backend/miniatures/tests/views/` — tests: 401 (no auth), 403 (authenticated non-staff), 201 on
  create, 200 on update, response body shape matches `StlModelDetailSerializer`, 400 on missing
  required fields (`name`, `source_name`).
