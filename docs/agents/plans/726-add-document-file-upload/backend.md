# Backend Plan: Add document file upload

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `upload_type` (`'image'`/`'file'`, default `'image'`) to `Upload`. Set explicitly by each upload-init view; existing photo-upload views keep the default.
- Route shape changes (coordinated with proxy/frontend): finalize becomes `PATCH /uploads/:upload_type/:id.json`; 404 if the URL's `upload_type` doesn't match the row's stored value.
- Init endpoints (`photo_upload.json`, new `file_upload.json`) return `upload_type` in their response.
- New `GameDocumentFile(BaseFile)` model, storage path root `'files'` instead of `'photos'`.

## Implementation Steps

### Step 1 — `Upload.upload_type` field + migration
In `backend/games/models/upload.py`, add:
```python
UPLOAD_TYPE_IMAGE = 'image'
UPLOAD_TYPE_FILE = 'file'
UPLOAD_TYPE_CHOICES = [(UPLOAD_TYPE_IMAGE, 'image'), (UPLOAD_TYPE_FILE, 'file')]

upload_type = models.CharField(max_length=10, choices=UPLOAD_TYPE_CHOICES, default=UPLOAD_TYPE_IMAGE)
```
Generate migration `backend/games/migrations/0074_upload_upload_type.py` (next number after `0073_rename_slain_and_allegiance_to_private.py`) via `makemigrations` — default backfills existing rows to `'image'` automatically.

### Step 2 — `BaseFile` abstract model + `GameDocumentFile`
Create `backend/games/models/base_file.py`, mirroring `backend/games/models/base_photo.py`:
```python
class BaseFile(models.Model):
    path = models.CharField(max_length=512, blank=True, default='')
    ready = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False, inherit=True)
    class Meta:
        abstract = True
    def __str__(self):
        return self.path
```
Create `backend/games/models/game/game_document_file.py`:
```python
class GameDocumentFile(BaseFile):
    game_document = models.ForeignKey(
        GameDocument, on_delete=models.CASCADE, related_name='files',
    )
```
Add both to the migration from Step 1 (or a follow-up migration in the same PR) — mirror the `CreateModel` shape used for `GameDocumentPhoto` in `backend/games/migrations/0072_characterdocument_characterdocumentphoto_and_more.py`. Register the new models in whatever `__init__.py`/admin registration pattern `GameDocumentPhoto` already follows.

### Step 3 — `PhotoPathBuilder` root param
In `backend/games/photo_path.py`, change `build()` (currently hardcoding `path_parts = ['photos', *normalized_segments, ...]`) to accept an optional `root='photos'` param and use it in place of the literal `'photos'`. No existing caller needs to change (default preserves current behavior).

### Step 4 — `FileUploadSerializer`
In `backend/games/serializers/photo_upload.py`, make `ALLOWED_EXTENSIONS` overridable per subclass (e.g. move it to a class attribute read via `self.ALLOWED_EXTENSIONS` instead of a module constant, or extract a shared base). Add a new serializer (same file or a new `file_upload.py`):
```python
class FileUploadSerializer(PhotoUploadSerializer):
    ALLOWED_EXTENSIONS = {'.pdf'}
```

### Step 5 — `UploadInitiator` serializer + upload_type params
In `backend/games/views/_upload_init.py`, add two new constructor params to `UploadInitiator`: `serializer_class=PhotoUploadSerializer` (backward-compatible default) and `upload_type=Upload.UPLOAD_TYPE_IMAGE` (backward-compatible default). Use `serializer_class` instead of the hardcoded `PhotoUploadSerializer`, and set `upload_type` on the created `Upload` row. Include `upload_type` in the JSON response built by `.run()`.

### Step 6 — `GameDocumentFileUploadPermission`
In `backend/games/permissions.py`, add a class mirroring `GameDocumentPhotoUploadPermission` (lines ~121-132) exactly (same `_is_allowed`: staff, game player, or edit-capable), named `GameDocumentFileUploadPermission`, consistent with the existing one-class-per-entity+action convention even though the logic is identical.

### Step 7 — `game_document_file_upload` view
Create `backend/games/views/games/game_document_file_upload.py`, mirroring `game_document_photo_upload.py` (lines ~1-43):
```python
@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_document_file_upload(request, game_slug, document_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(GameDocument, pk=document_id, game=game)
    error_response = GameDocumentFileUploadPermission.check(request, game)
    if error_response:
        return error_response
    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, document_id, filename),
        create_photo=lambda file_path: GameDocumentFile.objects.create(
            game_document=document, path=file_path, ready=False
        ),
        id_field='document_id',
        id_value=document.id,
        serializer_class=FileUploadSerializer,
        upload_type=Upload.UPLOAD_TYPE_FILE,
    )
    return initiator.run()

def _build_file_path(game_slug, document_id, filename):
    segments = ['games', game_slug, 'documents', document_id]
    return PhotoPathBuilder(segments, filename, use_uuid=True).build(root='files')
```
Add `X-Cache-Skip` handling matching whatever existing photo-upload views do for cache bypass (grep other upload views for `X-Cache-Skip` if `game_document_photo_upload` doesn't already set it explicitly at the view level vs proxy).

### Step 8 — URL routes
In `backend/games/urls/games.py`, add a sibling route next to the existing document photo_upload route (~line 64):
```python
path(
    'games/<slug:game_slug>/documents/<int:document_id>/file_upload.json',
    views.game_document_file_upload,
    name='game-document-file-upload',
),
```
In `backend/games/urls/uploads.py`, change the finalize route to carry `upload_type`:
```python
path('uploads/<str:upload_type>/<int:upload_id>.json', views.upload_finalize, name='upload-finalize'),
```

### Step 9 — `upload_finalize` upload_type check + registry entry
In `backend/games/views/upload_finalize.py`:
- Accept `upload_type` as a URL param; look up the `Upload` row, and return 404 if `upload.upload_type != upload_type` (before any other permission/content-object logic).
- Add `_document_file_permission`/`_set_document_file_if_unset` helper functions mirroring the existing `_document_photo_permission`/`_set_document_photo_if_unset` (~lines 123-128, 174-176).
- Register `GameDocumentFile: (_document_file_permission, _set_document_file_if_unset)` in `_PHOTO_HANDLERS` (~lines 187-193).

### Step 10 — Tests
- `backend/games/tests/views/games/game_document_file_upload_test.py`, cloned from `game_document_photo_upload_test.py` (169 lines) — same coverage: auth, permission, 404, filename validation (now `.pdf` only), happy path, `Upload`/`GameDocumentFile` record creation, `upload_type` in response, session-cookie auth.
- Update `backend/games/tests/views/upload_finalize_test.py` to cover: `upload_type` mismatch → 404, and a `GameDocumentFile` finalize happy path.
- Update `backend/games/tests/views/photo_upload_test.py` (and siblings) only if the response-shape change (`upload_type` field) breaks existing assertions.

## Files to Change
- `backend/games/models/upload.py` — add `upload_type` field + choices.
- `backend/games/migrations/0074_*.py` — new migration (upload_type field + GameDocumentFile/BaseFile models).
- `backend/games/models/base_file.py` — new abstract model.
- `backend/games/models/game/game_document_file.py` — new model.
- `backend/games/photo_path.py` — parametrize `root`.
- `backend/games/serializers/photo_upload.py` — make `ALLOWED_EXTENSIONS` overridable; add `FileUploadSerializer`.
- `backend/games/views/_upload_init.py` — add `serializer_class`/`upload_type` params to `UploadInitiator`, include `upload_type` in response.
- `backend/games/permissions.py` — add `GameDocumentFileUploadPermission`.
- `backend/games/views/games/game_document_file_upload.py` — new view.
- `backend/games/urls/games.py` — new `file_upload.json` route.
- `backend/games/urls/uploads.py` — add `upload_type` path param to finalize route.
- `backend/games/views/upload_finalize.py` — `upload_type` 404 check, registry entry for `GameDocumentFile`.
- `backend/games/tests/views/games/game_document_file_upload_test.py` — new tests.
- `backend/games/tests/views/upload_finalize_test.py` — updated/new tests.

## CI Checks
- `backend`: `pytest` (CI jobs `pytest_views_characters` / `pytest_views_rest` / `pytest_all`, per `.circleci/config.yml`).

## Notes
- Coordinate the `upload_type` URL-param change with the proxy agent (proxy's internal PATCH calls to backend must also send the new path shape) and the frontend agent (which builds the submit URL) — this is a breaking route change requiring a single coordinated deploy, per the issue's explicit confirmation.
- Double check whether other existing photo-upload views (game/character/item photo uploads) need any change at all — they should not, since `UploadInitiator`'s new params are backward-compatible defaults (`upload_type='image'`, `serializer_class=PhotoUploadSerializer`), and their finalize calls will simply start hitting `/uploads/image/:id.json` instead of `/uploads/:id.json` (proxy needs to build that URL; backend view is agnostic to which caller supplies the param, as long as it's always `image` for existing photo types).
