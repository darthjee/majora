# Plan: Creation of upload fails with 401

Issue: [210-creation-of-upload-fails-with-401.md](../issues/210-creation-of-upload-fails-with-401.md)

## Overview

The `photo_upload` view still uses the standard `TokenAuthentication`, which relies on the `Authorization: Token` header reaching Django. However, the Tent proxy strips this header, so authenticated requests return 401. The fix is to replace `TokenAuthentication` with `CookieTokenAuthentication` — the same class already used by all other protected views — which falls back to the session cookie when the header is absent.

## Context

Issue #184 introduced `CookieTokenAuthentication` in `source/games/authentication.py` and applied it to the access endpoints (`games.py`, `characters.py`, `treasures.py`). The `photo_upload` view was missed in that fix and still imports `TokenAuthentication` directly from DRF.

## Implementation Steps

### Step 1 — Switch photo_upload to CookieTokenAuthentication

In `source/games/views/photo_upload.py`:
- Remove the `from rest_framework.authentication import TokenAuthentication` import.
- Add `from ..authentication import CookieTokenAuthentication`.
- Change `@authentication_classes([TokenAuthentication])` to `@authentication_classes([CookieTokenAuthentication])`.

### Step 2 — Add session-based authentication test

In `source/games/tests/views/photo_upload_test.py`, add a test that authenticates via a session cookie (storing the token key in `client.session['auth_token']`) instead of the `Authorization` header and verifies the request succeeds with 201. This matches the pattern already used in `games_test.py`.

## Files to Change

- `source/games/views/photo_upload.py` — replace `TokenAuthentication` with `CookieTokenAuthentication`
- `source/games/tests/views/photo_upload_test.py` — add session-cookie authentication test

## CI Checks

- `source/`: `docker-compose run backend poetry run pytest` (CI job: `pytest`)

## Notes

- No migration needed — this is a pure view-layer change.
- The `upload_finalize.py` view was also checked: it does not use `authentication_classes` at all (inherits defaults), so it is unaffected.
