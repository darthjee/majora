# Plan: statistics_session is not tracking user id

Issue: [606-statistics-session-session-is-not-tracking-user-id.md](../../issues/606-statistics-session-session-is-not-tracking-user-id.md)

## Overview

`StatisticsSessionMiddleware` decides whether to attach a `user` to a statistics `Session` by reading `request.user.is_authenticated` *before* the view runs — at that point the Django-level `request.user` is always `AnonymousUser`, because this app authenticates via a custom DRF `CookieTokenAuthentication` resolved lazily at view-dispatch time, and `django.contrib.auth.login()` is never called. The only place a session ever picks up a user today is a one-off call in the `/login` view. This plan extracts the existing "attach, or rotate if already tied to a different user" logic into a shared helper and calls it from the middleware *after* the view has run (when DRF has resolved the real authenticated user and written it back onto the raw request), so any authenticated request — not just `/login` — backfills the session's user.

## Context

- `backend/statistics/models.py` — `Session.user` is a nullable FK, only ever set explicitly.
- `backend/statistics/middleware.py` — `_load_or_create_session` checks `request.user.is_authenticated` pre-view-dispatch; always `False` in practice.
- `backend/games/views/auth/login.py` — `_attach_statistics_session`/`_set_statistics_session` implement the only working "attach or rotate" logic today, but only run at `/login`.
- `backend/games/authentication.py` — `CookieTokenAuthentication`, a DRF authentication class resolved lazily via `Request.user` (DRF's `Request.user` setter writes the resolved user back onto the underlying `HttpRequest`, which is why a post-dispatch check in the middleware will see the real user).
- Existing tests: `backend/statistics/tests/middleware_test.py`, `backend/games/tests/auth/login_test.py` (covers the login-time attach/rotate behavior already).

## Implementation Steps

### Step 1 — Extract a shared "attach or rotate" helper

Add a small function (e.g. `backend/statistics/session_attachment.py::attach_user(session, user)`) that encapsulates the logic currently inlined in `login.py`'s `_attach_statistics_session`:

- If `session.user_id is None`: set `session.user = user`, `session.save(update_fields=['user'])`, return the same session.
- Else (already tied to a different or the same user): create and return a brand-new `Session.objects.create(ip=session.ip, user=user)`.

This function only deals with `Session` objects — no `request` coupling — so it can be reused from both the middleware and the login view.

### Step 2 — Update `login.py` to use the shared helper

Replace the body of `_attach_statistics_session` with a call to the new helper, keeping `_set_statistics_session`'s request-rebinding behavior (DRF `Request` vs raw `HttpRequest`) exactly as-is when the helper returns a different session instance than the one passed in.

### Step 3 — Backfill in the middleware after the view runs

In `StatisticsSessionMiddleware.__call__`, after `response = self.get_response(request)` and before `_set_cookie` is called: if `request.statistics_session.user_id is None` and `request.user.is_authenticated`, call the same `attach_user` helper and reassign `request.statistics_session` to its result. This makes every authenticated request — via `Authorization: Token` header or the session-stored `auth_token` — eligible to backfill the session's user, not just `/login`.

No change is needed for the `/login` request itself: DRF resolves `request.user` from credentials present *before* the view body runs, and at `/login` time no valid token exists yet, so the middleware's generic backfill correctly stays a no-op there and the explicit call in `login.py` remains the mechanism for that specific handshake moment.

### Step 4 — Tests

- `backend/statistics/tests/middleware_test.py`: add cases where a request carries a valid `Authorization: Token` for an existing user and an anonymous statistics session cookie — assert the session gets the user attached after the request, and that a session already tied to a different user gets rotated (new `Session` row, new cookie), mirroring the existing `login_test.py` rotation assertions.
- `backend/games/tests/auth/login_test.py`: no behavior change expected; keep passing as a regression check after the refactor in Step 2.
- Add/adjust a small unit test for the new `attach_user` helper directly (attach vs rotate cases) if it lives in its own module.

## Files to Change

- `backend/statistics/session_attachment.py` — new shared `attach_user(session, user)` helper.
- `backend/statistics/middleware.py` — call the helper post-response to backfill `user` on any authenticated request.
- `backend/games/views/auth/login.py` — reuse the shared helper instead of inlining the same logic.
- `backend/statistics/tests/middleware_test.py` — new tests for post-response backfill/rotation.
- `backend/statistics/tests/session_attachment_test.py` (new, if the helper is extracted into its own module) — unit tests for `attach_user`.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- Rotation semantics are preserved as-is (a session already tied to a *different* user is never overwritten in place — a new `Session` row is created, same as the current login-time behavior), so no product/security decision is being changed here, only where the existing rule gets applied.
- Non-DRF endpoints (plain Django views, if any) are unaffected: without DRF resolving `request.user`, the generic backfill stays a no-op there, matching today's behavior.
