# Backend Plan: List game document files and photos

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint table and serializer shapes. This agent produces all four listed endpoints (one of them, `photos.json`, already exists and needs no code change) and the new `GameDocumentFileSerializer`.

## Implementation Steps

### Step 1 — Add `GameDocumentFileSerializer`

New file `backend/games/serializers/games/documents/game_document_file.py`, mirroring `backend/games/serializers/games/documents/game_document_photo.py`'s shape but with the extra fields:

```python
class GameDocumentFileSerializer(serializers.ModelSerializer):
    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        model = GameDocumentFile
        fields = ['id', 'name', 'path', 'photo_path']
```

(`photo_path` mirrors `GameDocumentListSerializer.photo_path` in `game_document_list.py`.) Register the export in `backend/games/serializers/games/documents/__init__.py` and re-export it from `backend/games/serializers/__init__.py` (alongside the existing `GameDocumentPhotoSerializer` export).

### Step 2 — Add the `files.json` view (regular)

New file `backend/games/views/games/game_document_files.py`, mirroring `game_document_photos.py` exactly (same `AllowAny`/hidden-document-filtering shape), but over `GameDocumentFile`:

```python
def game_document_files(request, game_slug, document_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    document = get_object_or_404(game.documents.filter(hidden=False), id=document_id)
    files = document.files.filter(ready=True)
    return paginated_list_response(request, files, GameDocumentFileSerializer)
```

### Step 3 — Add the `files/all.json` view (private)

New file `backend/games/views/games/game_document_files_all.py`, combining `game_document_detail_full.py`'s permission/404 shape (dm/admin only, 404 for a nonexistent document regardless of hidden status, `X-Skip-Cache: true`) with `game_documents_all.py`'s pagination shape:

```python
def game_document_files_all(request, game_slug, document_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response
    document = get_object_or_404(game.documents.all(), id=document_id)
    response = paginated_list_response(request, document.files.filter(ready=True), GameDocumentFileSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
```

### Step 4 — Add the `photos/all.json` view (private)

New file `backend/games/views/games/game_document_photos_all.py` — same shape as Step 3 but over `document.photos.filter(ready=True)` and `GameDocumentPhotoSerializer` (already imported/exists, no new serializer needed).

### Step 5 — Wire up views and URLs

- `backend/games/views/games/__init__.py`: import and add to `__all__`: `game_document_files`, `game_document_files_all`, `game_document_photos_all`.
- `backend/games/urls/games.py`: add three routes near the existing `photos.json` route (`games/<slug:game_slug>/documents/<int:document_id>/...`):
  - `files.json` → `views.game_document_files`, name `game-document-files`
  - `files/all.json` → `views.game_document_files_all`, name `game-document-files-all`
  - `photos/all.json` → `views.game_document_photos_all`, name `game-document-photos-all`

### Step 6 — Tests

Mirror `backend/games/tests/views/games/game_document_photos_test.py` for each new view:
- `backend/games/tests/views/games/game_document_files_test.py` — empty list, only `ready=True` files returned, `id`/`name`/`path`/`photo_path` fields present (`photo_path` null when no photo), 404 for hidden document, 404 for unknown document/game/wrong-game, pagination headers, `?page=`/`?per_page=` respected, URL reverses by name.
- `backend/games/tests/views/games/game_document_files_all_test.py` — mirror `game_documents_all_test.py`'s permission tests (401 unauthenticated, 403 non-dm, 200 for dm/admin/superuser) plus: includes hidden document's files, 404 only for a nonexistent document (not for a hidden one), pagination.
- `backend/games/tests/views/games/game_document_photos_all_test.py` — same shape as the files-all test, over photos.
- `backend/games/tests/serializers/games/documents/game_document_file_test.py` — mirrors `game_document_list_test.py`'s style: asserts the four fields, and that `photo_path` is `None` when `photo` is unset.

## Files to Change
- `backend/games/serializers/games/documents/game_document_file.py` — new `GameDocumentFileSerializer`.
- `backend/games/serializers/games/documents/__init__.py`, `backend/games/serializers/__init__.py` — export it.
- `backend/games/views/games/game_document_files.py` — new regular files list view.
- `backend/games/views/games/game_document_files_all.py` — new private files list view.
- `backend/games/views/games/game_document_photos_all.py` — new private photos list view.
- `backend/games/views/games/__init__.py` — export the three new views.
- `backend/games/urls/games.py` — three new routes.
- `backend/games/tests/serializers/games/documents/game_document_file_test.py` — new.
- `backend/games/tests/views/games/game_document_files_test.py` — new.
- `backend/games/tests/views/games/game_document_files_all_test.py` — new.
- `backend/games/tests/views/games/game_document_photos_all_test.py` — new.

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) for the view tests.
- `backend`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`) for the serializer test.
- `backend`: `docker-compose run --rm majora_be poetry run ruff check .` (CI job: `checks`).

## Notes
- No migration is needed — `GameDocumentFile`, `GameDocumentFilePhoto`, and `GameDocumentPhoto` already exist (issue #874/#877 groundwork).
- The `ready=True` filter on files mirrors the existing photo-list convention (`document.photos.filter(ready=True)`); `GameDocumentFile.ready` already exists on `BaseFile`, presumably flipped by the existing `game_document_file_upload.py` upload-completion flow.
- `photos.json`'s existing `per_page` support already satisfies the issue's `per_page=11` requirement — that value is entirely a frontend-side request parameter, not something the backend needs to special-case per endpoint.
