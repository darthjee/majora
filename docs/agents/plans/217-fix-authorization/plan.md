# Plan: Fix Authorization

Issue: [217-fix-authorization.md](../issues/217-fix-authorization.md)

## Overview

Several views still declare `@authentication_classes([TokenAuthentication])` or inherit the
global `TokenAuthentication` default, which means cookie-only users (browser sessions) cannot
authenticate. The fix is two-pronged: (1) change the project-wide default in
`settings.py` to `CookieTokenAuthentication`, and (2) replace any explicit
`@authentication_classes([TokenAuthentication])` decorators on affected views. New tests
cover the cookie path for every affected endpoint.

## Context

`CookieTokenAuthentication` already exists in `source/games/authentication.py`. It extends
`TokenAuthentication` and falls back to `request.session['auth_token']` when no
`Authorization: Token` header is present. It is already applied to most views in
`games.py`, `characters.py`, and `treasures.py`, but not to:

- `DELETE /users/logout.json` (no explicit decorator — falls back to global default, which is currently `TokenAuthentication`)
- `POST /users/language.json` (same — no decorator, falls back to global default)
- `POST /users/test-email.json` (same)
- `GET/POST /games/<slug>/game_masters.json` and `DELETE /games/<slug>/game_masters/<id>.json` in `game_masters.py` (explicitly `@authentication_classes([TokenAuthentication])`)
- `PATCH /uploads/<id>.json` in `upload_finalize.py` (explicitly `@authentication_classes([TokenAuthentication])`)

## Implementation Steps

### Step 1 — Change the global default authentication class

In `source/majora_project/settings.py`, update `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']`:

```python
'DEFAULT_AUTHENTICATION_CLASSES': [
    'games.authentication.CookieTokenAuthentication',
],
```

This fixes `logout`, `language`, and `test_email` views automatically (they carry no
explicit `@authentication_classes` decorator and will inherit the new default).

### Step 2 — Remove/replace `@authentication_classes([TokenAuthentication])` in `game_masters.py`

In `source/games/views/game_masters.py`:
- Remove the `from rest_framework.authentication import TokenAuthentication` import (no longer needed).
- Replace `@authentication_classes([TokenAuthentication])` with `@authentication_classes([CookieTokenAuthentication])` on both `game_masters_list` and `game_master_detail`, importing `CookieTokenAuthentication` from `..authentication`.

### Step 3 — Replace `@authentication_classes([TokenAuthentication])` in `upload_finalize.py`

In `source/games/views/upload_finalize.py`:
- Replace `from rest_framework.authentication import TokenAuthentication` import with `from ..authentication import CookieTokenAuthentication`.
- Replace `@authentication_classes([TokenAuthentication])` with `@authentication_classes([CookieTokenAuthentication])` on `upload_finalize`.

### Step 4 — Add tests for cookie-authenticated logout

In `source/games/tests/auth_test.py`, add to `TestLogoutView`:
- `test_revokes_token_via_session_cookie` — store token in session, call `DELETE /users/logout.json` with no `Authorization` header, expect 204 and token gone.

### Step 5 — Add tests for cookie-authenticated game master endpoints

In `source/games/tests/views/game_masters_test.py`, add tests that:
- Call `POST /games/<slug>/game_masters.json` with a session cookie (no token header) and assert 201.
- Call `DELETE /games/<slug>/game_masters/<id>.json` with a session cookie and assert 204.

### Step 6 — Add tests for cookie-authenticated upload finalize

In `source/games/tests/views/upload_finalize_test.py`, add a test that:
- Calls `PATCH /uploads/<id>.json` with session-cookie authentication and the correct `X-Upload-Token` header, and asserts 200.

## Files to Change

- `source/majora_project/settings.py` — change `DEFAULT_AUTHENTICATION_CLASSES` to `CookieTokenAuthentication`
- `source/games/views/game_masters.py` — replace `TokenAuthentication` with `CookieTokenAuthentication`
- `source/games/views/upload_finalize.py` — replace `TokenAuthentication` with `CookieTokenAuthentication`
- `source/games/tests/auth_test.py` — add cookie logout test
- `source/games/tests/views/game_masters_test.py` — add cookie auth tests
- `source/games/tests/views/upload_finalize_test.py` — add cookie auth test

## CI Checks

- `source/`: `docker-compose run --rm backend pytest` (CI job: `pytest`)

## Notes

- The `status` view already handles session auth via its own custom `_authenticate_from_session` helper (it uses `@authentication_classes([])` to skip DRF's auth chain entirely); no change needed there.
- After this change, no view in the project should import or use bare `TokenAuthentication` except inside `authentication.py` itself (where `CookieTokenAuthentication` inherits from it).
