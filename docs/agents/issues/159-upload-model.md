# Issue: Add upload model

## Description
Add an `Upload` Django model to track the state of a game photo upload, as part of the game photo upload flow (issue #127).

## Problem
The game photo upload flow (#127) requires a server-side record to coordinate the multi-step upload process: it needs to hold a secure token for proxy validation, track the current upload status, store the target file path, and record the expiration time and the user who initiated it.

## Expected Behavior
- When a user initiates a photo upload, an `Upload` record is created with status `pending`, a secure random token, the pre-computed file path, and an expiration timestamp set to `now() + 1 hour`
- Status transitions: `pending` → `uploading` → `uploaded`; no further updates accepted after `uploaded`
- The upload expires after 1 hour (configurable via environment/settings)

## Solution
New `Upload` model in `source/games/models/upload.py`:

- `token: CharField(max_length=64, unique=True)` — generated with `secrets.token_urlsafe(32)` at creation
- `status: CharField` with choices: `pending` / `uploading` / `uploaded`; no updates accepted once `uploaded`
- `file_path: CharField` — relative path where the file will be stored (e.g. `photos/games/:game_slug/file_name_<uuid>.<ext>`)
- `user: ForeignKey(User, on_delete=CASCADE)` — the user who initiated the upload
- `expiration_time: DateTimeField` — set at creation to `now() + timedelta` (duration from settings, default 1 hour)

Follow the `PasswordResetToken` pattern for token generation. Register the model in `games/models/__init__.py`.

---

## Benefits
Provides the coordination record needed for the secure, multi-step proxy-handled upload flow described in issue #127.
