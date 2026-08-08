# Backend Plan: Add create stl_model page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces both endpoints in [plan.md](plan.md)'s "Shared contracts" #1 and #2, exactly as specified there (request/response shapes, status codes, permission gate). Frontend and translator rely on those paths/shapes as given — no renegotiation needed here.

## Implementation Steps

### Step 1 — Tag-sync helper for the create serializer

Add a small helper (e.g. `backend/miniatures/serializers/_tags_sync.py` or inline in the create serializer module — follow whichever module layout `stl_model_detail.py`/`stl_model_link.py` already establish for `miniatures/serializers/`) that, given a validated list of tag strings and a `StlModel` instance:
1. For each string: lowercase it, `Tag.objects.get_or_create(name=<lowercased>)`, then `stl_model.tags.add(tag)`.
2. Wrap the loop in `transaction.atomic()`, mirroring `CharacterLinksSync.create_all` (`backend/games/serializers/characters/character_link_write.py`) — a mid-batch failure rolls back every tag already attached in this call.

Add a `MAX_TAGS = 20` constant (own name, this is not the same limit as `CharacterLinkWriteSerializer.MAX_LINKS`) and a `validate_tags_count(value)` function raising `serializers.ValidationError` when `len(value) > MAX_TAGS`, mirroring `validate_links_count`'s shape.

### Step 2 — `StlModelCreateSerializer`

New file `backend/miniatures/serializers/stl_model_create.py`:
- `name` — required (`extra_kwargs={'required': True}`, mirroring `TreasureCreateSerializer`).
- `tags` — a write-only field accepting a list of strings (e.g. `serializers.ListField(child=serializers.CharField(max_length=200), required=False, default=list)` — the per-item `max_length=200` on the child field is what turns an over-long tag into a clean `400` instead of a raw DB error at `get_or_create` time). Validate the list length via `validate_tags` calling `validate_tags_count` from Step 1.
- `create()` override: create the `StlModel` from `name` only, then run Step 1's tag-sync helper with the validated `tags` list, then return the instance.
- No `sources`/`photo` fields at all (out of scope per the issue).

Register it in `backend/miniatures/serializers/__init__.py` alongside the existing serializer exports.

### Step 3 — Wire `POST` into `stl_models_list`

Edit `backend/miniatures/views/stl_models_list.py`:
- Add `'POST'` to the `@api_view([...])` decorator list.
- Keep `@permission_classes([IsAuthenticated])` as-is (already covers the `401` case for both methods).
- Branch on `request.method == 'POST'` to a `_create_stl_model(request)` helper (mirroring `treasures_list`'s own `_create_treasure` split):
  - `require_staff(request)` (import from `games.views.common`, same cross-app style `accounts`/`staff` already use) — return its error response if any (`403`, or `401` if somehow reached unauthenticated).
  - Validate `StlModelCreateSerializer(data=request.data)` via the existing `validated_or_error` helper (also from `games.views.common`, or `miniatures`'s own equivalent if one exists — check first).
  - Save, wrap the response in `skip_cache(...)` (per `miniatures/_shared.py`'s existing convention on every miniatures endpoint), return `201` with `StlModelDetailSerializer(stl_model).data`.

### Step 4 — Photo-upload endpoint

New file `backend/miniatures/views/stl_model_photo_upload.py`, mirroring `backend/games/views/treasures/treasure_photo_upload.py` structurally:
- `@api_view(['POST'])`, `@authentication_classes([CookieTokenAuthentication])`, permission via `require_staff(request)` inline (not `EndpointPermission` — no game-ownership concept exists for `StlModel`).
- `get_object_or_404(StlModel, pk=stl_model_id)`.
- Deterministic file path: `PhotoPathBuilder(['stl_models', stl_model_id], f'photo{ext}', use_uuid=False).build()`.
- Reuse-or-create the `StlModelPhoto` on `stl_model.photo` (same shape as treasure's `_reuse_or_create_photo`): if `stl_model.photo_id` is set, update its `path`/`ready=False` and save; else `StlModelPhoto.objects.create(stl_model=stl_model, path=file_path, ready=False)`.
- Delegate the actual init response to `UploadInitiator` (`backend/games/views/_upload_init.py` — check whether `miniatures` already imports cross-app from `games.views` elsewhere, or whether it needs its own thin wrapper; `PhotoPathBuilder` lives in `backend/miniatures/photo_path.py` already per `treasure_photo_upload.py`'s own import, so this cross-app direction already exists).
- Wrap the response in `skip_cache(...)`.

### Step 5 — URL registration

Add to `backend/miniatures/urls/stl_models.py`:
```python
path(
    'miniatures/stl_models/<int:stl_model_id>/photo_upload.json',
    views.stl_model_photo_upload,
    name='miniatures-photo-upload',
),
```
Register the new view in `backend/miniatures/views/__init__.py` alongside the existing `stl_models_list`/`stl_model_detail` exports.

### Step 6 — Unrelated tweak: `CharacterLinkWriteSerializer.MAX_LINKS`

In `backend/games/serializers/characters/character_link_write.py`, change `MAX_LINKS = 50` to `MAX_LINKS = 10`. Update its docstring/comment if it cites the old value. Check `backend/games/tests/serializers/characters/character_link_write_test.py` for any test asserting the exact `50` boundary and update it to `10`.

### Step 7 — Tests

Follow existing test layout under `backend/miniatures/tests/`:
- `tests/serializers/stl_model_create_test.py` — valid create (name only, name+tags), missing `name` → 400, tag count > 20 → 400, over-length tag → 400, lowercase/dedupe/get-or-create behavior (existing `Tag` reused, new one created, casing-insensitive), tags attached to the new `StlModel`.
- `tests/views/stl_models_list_test.py` — extend for `POST`: 201 on staff/superuser, 401 unauthenticated, 403 authenticated-non-staff, 400 on invalid payload, response body shape matches `StlModelDetailSerializer`.
- `tests/views/stl_model_photo_upload_test.py` (new) — mirrors `tests/views/treasures/treasure_photo_upload_test.py`: 201/200 init response on staff/superuser, 403 non-staff, 404 unknown id, reuse-vs-create `StlModelPhoto` branches.
- `tests/models/` — none needed (no model changes).
- Update `backend/games/tests/serializers/characters/character_link_write_test.py` per Step 6.

## Files to Change
- `backend/miniatures/serializers/_tags_sync.py` (or inline) — new tag-sync helper + `MAX_TAGS`/`validate_tags_count`.
- `backend/miniatures/serializers/stl_model_create.py` — new create serializer.
- `backend/miniatures/serializers/__init__.py` — export the new serializer.
- `backend/miniatures/views/stl_models_list.py` — add `POST` branch.
- `backend/miniatures/views/stl_model_photo_upload.py` — new photo-upload view.
- `backend/miniatures/views/__init__.py` — export the new view.
- `backend/miniatures/urls/stl_models.py` — new URL entry.
- `backend/games/serializers/characters/character_link_write.py` — `MAX_LINKS` 50 → 10.
- `backend/miniatures/tests/serializers/stl_model_create_test.py` — new.
- `backend/miniatures/tests/views/stl_models_list_test.py` — extend.
- `backend/miniatures/tests/views/stl_model_photo_upload_test.py` — new.
- `backend/games/tests/serializers/characters/character_link_write_test.py` — update boundary assertions.

## CI Checks
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — plus `poetry run pytest games/tests/views/` locally too, since `character_link_write_test.py` sits under `games/tests/serializers/`, not `games/tests/views/`, so `pytest_all`'s own ignore doesn't exclude it; the character-specific view jobs (`pytest_views_characters`, `pytest_views_rest`) don't need touching since no character *view* changes here.
- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `bin/reports.sh ci` (CI job: `checks`, complexity)

## Notes
- Double-check whether `miniatures` already has its own `validated_or_error`/`require_staff`-equivalent helpers before importing cross-app from `games.views.common` — reuse whatever's idiomatic for this app if it exists, otherwise the cross-app import is already precedented (`accounts`/`staff` do it).
- `StlModelCreateSerializer`'s per-item `CharField(max_length=200)` handles the length-validation edge case from the issue; confirm `Tag.name`'s actual max_length hasn't drifted from 200 before hardcoding it.
