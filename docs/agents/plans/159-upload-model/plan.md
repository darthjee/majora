# Plan: Add Upload Model

Issue: [159-upload-model.md](../issues/159-upload-model.md)

## Overview

Add an `Upload` Django model to `source/games/` that tracks the lifecycle of a game photo upload. The model holds a secure random token, a status (pending/uploading/uploaded), a target file path, the initiating user, and an expiration timestamp. It follows the same patterns as `PasswordResetToken`.

## Context

Issue #127 (game photo upload flow) requires a server-side coordination record to manage the multi-step proxy-handled upload process. This issue adds only the model and its tests — no views or serializers.

## Implementation Steps

### Step 1 — Add `upload_expiration_minutes` to Settings

Add a new static method `Settings.upload_expiration_minutes()` to `source/games/settings.py`, reading from `MAJORA_UPLOAD_EXPIRATION_MINUTES` with a default of 60. Follow the same pattern as `password_reset_token_expiration_minutes`.

### Step 2 — Create `source/games/models/upload.py`

Write the `Upload` model:

- `user`: `ForeignKey(User, on_delete=CASCADE, related_name='uploads')`
- `token`: `CharField(max_length=64, unique=True)` — generated at creation with `secrets.token_urlsafe(32)`
- `status`: `CharField` with choices `pending` / `uploading` / `uploaded`; default `pending`
- `file_path`: `CharField(max_length=512)` — relative path where the file will be stored
- `expiration_time`: `DateTimeField` — set at creation to `timezone.now() + timedelta(minutes=Settings.upload_expiration_minutes())`

Override `save()` so that once `status` is `uploaded`, no further updates are accepted (raise `ValueError` or silently skip — raise is preferred for clarity).

Add a `__str__` method: `Upload(user=<username>, status=<status>)`.

### Step 3 — Register in `source/games/models/__init__.py`

Import `Upload` from `games.models.upload` and add it to `__all__`.

### Step 4 — Create migration

Run `docker-compose run majora python manage.py makemigrations games` to generate the migration file. Verify it is the next number in sequence after `0016_gamephoto.py`.

### Step 5 — Register in `source/games/admin.py`

Register the `Upload` model with Django Admin so it is visible in the admin panel.

### Step 6 — Write tests

Create `source/games/tests/models/test_upload.py` covering:

- Token is auto-generated and unique (not blank after `save()`)
- Default status is `pending`
- Expiration time is set to approximately `now + 1h` on creation
- Status cannot be updated once `uploaded` (raises `ValueError`)
- `Settings.upload_expiration_minutes()` reads from env var, defaults to 60, handles invalid/empty values
- `__str__` format

Also add `TestSettingsUploadExpirationMinutes` tests to `source/games/tests/settings_test.py` (or a new file, whichever is consistent with the existing settings test file that already covers `PasswordResetToken` expiration — extend the existing file).

## Files to Change

- `source/games/settings.py` — add `upload_expiration_minutes()` static method
- `source/games/models/upload.py` — new file with `Upload` model
- `source/games/models/__init__.py` — register `Upload`
- `source/games/migrations/0017_upload.py` — generated migration (number may vary)
- `source/games/admin.py` — register `Upload` with Django Admin
- `source/games/tests/models/test_upload.py` — new test file
- `source/games/tests/settings_test.py` — add settings tests for `upload_expiration_minutes`

## CI Checks

- `source/`: `docker-compose run majora_tests poetry run pytest` (CI job: `pytest`)

## Notes

- Token generation must use `secrets.token_urlsafe(32)` (same as `PasswordResetToken` pattern).
- The "no updates after uploaded" guard must be in `save()` — not just a docstring.
- The migration number depends on what is currently the highest migration; at time of writing it is `0016_gamephoto.py`, so the next is `0017`.
- No views, serializers, or endpoints are added in this issue — only the model.
