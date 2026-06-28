# Plan: Add backend endpoint to finalize photo upload

Issue: [161-add-backend-endpoint-to-finalize-photo-upload.md](../issues/161-add-backend-endpoint-to-finalize-photo-upload.md)

## Overview

Extend the `Upload` model with a generic foreign key so it can reference any target object (initially `GamePhoto`), and add a `PATCH /uploads/<id>.json` endpoint that the proxy calls to advance the upload lifecycle (`pending` → `uploading` → `uploaded`). On `uploaded`, the endpoint sets `content_object.ready = True` so the `GamePhoto` becomes visible.

## Context

The game photo upload flow requires a backend endpoint the proxy calls after it receives the file. The `Upload` model currently has no link to the object it is associated with (`GamePhoto`), making it impossible to check game edit permission or mark the photo as ready. A generic foreign key is the correct solution because it makes `Upload` reusable for any future uploadable model, not just `GamePhoto`.

## Implementation Steps

### Step 1 — Extend `Upload` model with generic FK fields

Add three new fields to `Upload` in `source/games/models/upload.py`:

- `content_type = ForeignKey(ContentType, on_delete=CASCADE, null=True, blank=True)` — identifies the model class of the connected object
- `object_id = PositiveIntegerField(null=True, blank=True)` — the PK of the connected object
- `content_object = GenericForeignKey('content_type', 'object_id')` — the Django accessor

Use `null=True, blank=True` so the fields are optional and backwards-compatible for rows created before this migration.

Import `ContentType` from `django.contrib.contenttypes.models` and `GenericForeignKey` from `django.contrib.contenttypes.fields`. Confirm `django.contrib.contenttypes` is in `INSTALLED_APPS` (it almost certainly is — check `source/majora_project/settings.py`).

### Step 2 — Generate and verify the migration

Run `makemigrations` inside Docker:

```bash
docker-compose run majora python manage.py makemigrations
```

Inspect the generated file under `source/games/migrations/` to confirm it adds `content_type` (FK to `contenttypes`) and `object_id` to the `upload` table. Rename or tidy if the auto-generated name is misleading.

### Step 3 — Wire the generic FK in `photo_upload` view

In `source/games/views/photo_upload.py`, after creating the `GamePhoto`, set `upload.content_object = game_photo` and save. This links the two objects through the generic FK.

```python
upload = Upload.objects.create(user=request.user, file_path=file_path)
game_photo = GamePhoto.objects.create(game=game, path=file_path, ready=False)
upload.content_object = game_photo
upload.save()
```

### Step 4 — Add the new `upload_finalize` view

Create `source/games/views/upload_finalize.py` with a `PATCH /uploads/<id>.json` view:

```python
@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_finalize(request, upload_id):
    ...
```

Validation sequence (return 403 on any failure unless stated otherwise):
1. Look up `Upload` by `upload_id` — return 404 if not found (use `get_object_or_404`)
2. Check `request.META.get('HTTP_X_UPLOAD_TOKEN')` matches `upload.token` — return 403 if not
3. Check `request.user == upload.user` — return 403 if not
4. Check `timezone.now() < upload.expiration_time` — return 403 if expired
5. Check `upload.status != Upload.STATUS_UPLOADED` — return 403 if already uploaded
6. Derive game via `upload.content_object.game`; call `GameEditPermission.check(request, game)` — return its response if it returns one
7. Parse `status` from `request.data`; validate it is one of `uploading` or `uploaded`
8. `upload.status = status; upload.save()`
9. If `status == 'uploading'`: return 200 with `{'file_path': upload.file_path}`
10. If `status == 'uploaded'`: set `upload.content_object.ready = True; upload.content_object.save()` — return 200

### Step 5 — Register the URL

Add to `source/games/urls.py`:

```python
path('uploads/<int:upload_id>.json', views.upload_finalize, name='upload-finalize'),
```

Export `upload_finalize` from `source/games/views/__init__.py`.

### Step 6 — Write tests

Create `source/games/tests/views/upload_finalize_test.py` following the same structure as `photo_upload_test.py`. Cover:

- 404 when upload does not exist
- 403 when `X-Upload-Token` does not match
- 403 when authenticated user is not the upload owner
- 403 when the upload has expired
- 403 when the upload is already `uploaded`
- 403 when the user does not have game edit permission
- 200 + `{file_path}` on `status: uploading`; upload status is set to `uploading`
- 200 on `status: uploaded`; `GamePhoto.ready` is set to `True`

Also extend `source/games/tests/models/test_upload.py` to cover the new generic FK fields (field presence and assignment).

## Files to Change

- `source/games/models/upload.py` — add `content_type`, `object_id`, `content_object` fields
- `source/games/migrations/0019_upload_content_type_object_id.py` — new migration (auto-generated, then reviewed)
- `source/games/views/photo_upload.py` — link `upload.content_object = game_photo` after creation
- `source/games/views/upload_finalize.py` — new file with the `upload_finalize` view
- `source/games/views/__init__.py` — export `upload_finalize`
- `source/games/urls.py` — register `uploads/<int:upload_id>.json`
- `source/games/tests/views/upload_finalize_test.py` — new test file
- `source/games/tests/models/test_upload.py` — extend to cover new generic FK fields

## CI Checks

- `source/`: `docker-compose run majora pytest` (CI job: `pytest`)

## Notes

- `django.contrib.contenttypes` must be in `INSTALLED_APPS` for `ContentType` and `GenericForeignKey` to work — check `source/majora_project/settings.py` before writing the migration.
- The `Upload.save()` method raises `ValueError` once status is `uploaded`, so `upload.content_object.save()` must be called separately and before any further `upload.save()` call on the same instance.
- The validation order in Step 4 follows the spec in the issue exactly; keep it in that order to avoid leaking information about whether an upload exists to an unauthenticated caller.
- `object_id` should be `PositiveIntegerField` (not `BigAutoField`) to match Django's standard generic relation convention.
