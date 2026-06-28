# Plan: Fix Access Endpoints

Issue: [184-fix-access-endpoints.md](../issues/184-fix-access-endpoints.md)

## Overview

The three access endpoints (`/games/<slug>/access.json`, `/games/<slug>/pcs/<id>/access.json`, `/games/<slug>/npcs/<id>/access.json`) use `@authentication_classes([TokenAuthentication])`, which only handles `Authorization: Token` headers. When the client authenticates via a session cookie (which stores `auth_token` in the session), `request.user` is never populated by DRF, so all serializer fields return null. The fix is a single custom authentication class, `CookieTokenAuthentication`, that first tries the token header, then falls back to the session.

## Context

- Login (`/users/login.json`) stores the token key in `request.session['auth_token']`.
- The `status` endpoint (`/users/status.json`) works around this with a manual `_authenticate_from_session` helper — that logic becomes the fallback in `CookieTokenAuthentication`.
- The three affected views are in `source/games/views/games.py` and `source/games/views/characters.py`.
- All existing serializers already handle authenticated vs. unauthenticated correctly — only the auth layer needs to change.

## Implementation Steps

### Step 1 — Create `CookieTokenAuthentication`

Create `source/games/authentication.py` with a `CookieTokenAuthentication` class that:
1. Calls `super().authenticate(request)` (standard `TokenAuthentication` header path).
2. If that returns `None`, reads `request.session.get('auth_token')`, looks up `Token.objects.select_related('user').get(key=...)`, and returns `(token_obj.user, token_obj)`.
3. If the session key is missing or the token does not exist, returns `None` (anonymous).

The class should inherit from `rest_framework.authentication.TokenAuthentication`.

### Step 2 — Replace `@authentication_classes` on the three access views

In `source/games/views/games.py` and `source/games/views/characters.py`, replace:
```python
@authentication_classes([TokenAuthentication])
```
with:
```python
@authentication_classes([CookieTokenAuthentication])
```
on the three views: `game_access`, `game_pc_access`, `game_npc_access`.

Import `CookieTokenAuthentication` from `games.authentication` in each file and remove the now-unused `TokenAuthentication` import if it is no longer needed elsewhere in that file.

### Step 3 — Add tests for `CookieTokenAuthentication`

Add a test file `source/games/tests/authentication_test.py` (or extend existing tests) that covers:
- Header-based auth still works (existing behavior).
- Session-based auth (setting `client.session['auth_token'] = token.key`) returns the correct user.
- Missing session token → anonymous (returns `None`).
- Stale/deleted session token → anonymous (returns `None`).

Also add session-based test cases to the existing `TestGameAccessView`, `TestGamePcAccessView`, and `TestGameNpcAccessView` classes in `source/games/tests/views/games_test.py` and `source/games/tests/views/characters_test.py`, mirroring the header-based tests with session-based auth.

## Files to Change

- `source/games/authentication.py` — new file; defines `CookieTokenAuthentication`
- `source/games/views/games.py` — replace `TokenAuthentication` with `CookieTokenAuthentication` on `game_access`
- `source/games/views/characters.py` — replace `TokenAuthentication` with `CookieTokenAuthentication` on `game_pc_access` and `game_npc_access`
- `source/games/tests/authentication_test.py` — new test file for the authentication class itself
- `source/games/tests/views/games_test.py` — add session-based auth tests to `TestGameAccessView`
- `source/games/tests/views/characters_test.py` — add session-based auth tests to `TestGamePcAccessView` and `TestGameNpcAccessView`

## CI Checks

- `source/`: `docker-compose run majora_tests poetry run pytest` (CI job: `pytest`)

## Notes

- The `_authenticate_from_session` helper in `source/games/views/auth.py` can remain unchanged — the `status` view uses it independently.
- No migration is needed (no model changes).
- No frontend or infra changes needed.
