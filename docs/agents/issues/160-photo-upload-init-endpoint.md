# Issue: Add endpoint to start game photo upload

## Description
Add the `POST /games/:game_slug/photo_upload.json` endpoint that initialises the game photo upload process, creating an `Upload` record and a `GamePhoto` record, and returning the upload id and token to the client.

## Problem
The game photo upload flow (#127) needs a first step: an authenticated endpoint that reserves a file path, creates the coordination records, and returns the upload id and secure token the client will use in subsequent steps.

## Expected Behavior
The client sends `POST /games/:game_slug/photo_upload.json` with the target filename. The endpoint:
1. Validates the user is authenticated and can edit the game (using `GameEditPermission`)
2. Creates an `Upload` record (from #159) with: status `pending`, a secure random token, the user, the pre-computed file path, and an expiration time of now + 1 hour
3. Creates a `GamePhoto` record with: the same relative file path (`photos/games/:game_slug/file_name_<random_uuid>.<extension>`), `ready = False`, and associated to the game
4. Returns the Upload `id` and `token`; the file path is stored but not returned

## Solution
- Add `path: CharField` and `ready: BooleanField(default=False)` to the `GamePhoto` model and generate a migration
- Add function-based view `photo_upload` (POST) in `source/games/views/`:
  - Extracts `game_slug` from URL and `filename` from request body
  - Checks `GameEditPermission`
  - Generates a random UUID and derives the file path and extension from the submitted filename
  - Creates `Upload` and `GamePhoto` records
  - Returns 201 with `{ id, token }`
- Register URL as `games/<slug:game_slug>/photo_upload.json` in `source/games/urls.py`

---

## Benefits
Enables the first step of the secure upload flow: the client gets the upload id and token it needs to submit the actual file through the proxy.
