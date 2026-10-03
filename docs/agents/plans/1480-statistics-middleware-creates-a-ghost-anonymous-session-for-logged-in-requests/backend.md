# Backend Plan: Statistics middleware creates a ghost anonymous Session for logged-in requests

Main plan: [plan.md](plan.md)

## Overview
Track which statistics session was created during the current request and, in the post-view
backfill, attach the authenticated user to that row in place instead of rotating to a new row.

## Context
Authentication is DRF `CookieTokenAuthentication`, resolved inside the view, so
`_load_or_create_session` (in `backend/statistics/middleware.py`) sees an anonymous
`request.user` and creates `Session(user=None)`. `_backfill_user` then calls
`attach_user(session, request.user, always_rotate=True)`, creating a second row and leaving the
first one as an anonymous ghost. `attach_user` (`backend/statistics/session_attachment.py`) without
`always_rotate` already performs an atomic in-place update filtered on `user_id__isnull=True`,
falling back to creating a new row if it loses the race.

## Implementation Steps

### Step 1 — Attach in place for sessions created during the request
- In `StatisticsSessionMiddleware.__call__` / `_load_or_create_session`, remember the session
  created during this request (e.g. keep the created instance and pass it to `_backfill_user`, or
  set a request attribute such as `request.statistics_session_created`). Prefer an identity check
  (`request.statistics_session is created_session`) so a view that rebinds the session is handled.
- In `_backfill_user`: if the current session is the one created during this request, call
  `attach_user(session, request.user)` (no `always_rotate`); otherwise keep
  `attach_user(session, request.user, always_rotate=True)`. Update the docstring to explain both
  branches (created-this-request rows cannot belong to anyone else; pre-existing anonymous rows are
  never silently claimed on shared devices).
- Do not resolve the user in the middleware before the view; do not touch
  `accounts/views/auth/_shared.py::attach_statistics_session` (login/poll already attach in place,
  so the backfill stays a no-op there).

### Step 2 — Tests
In `backend/statistics/tests/middleware_test.py`, following the existing pattern (`UserFactory`,
`Token.objects.create`, GET `/games.json` with `HTTP_AUTHORIZATION=f'Token {key}'`), add tests for
a logged-in request with: changed IP, changed domain, missing cookie, invalid/tampered cookie. Each
must result in exactly one new `Session` tied to the user (no anonymous row created), and the
response cookie must carry that row's token. Keep
`test_backfills_user_on_anonymous_session_when_request_is_authenticated` (pre-existing anonymous
session still rotates). Ensure existing login/poll tests still pass.

## Files to Change
- `backend/statistics/middleware.py` — record created session; branch in `_backfill_user`; docstring.
- `backend/statistics/tests/middleware_test.py` — new scenarios.

## CI Checks
- `backend`: `.claude/scripts/check_backend.sh` (pytest + ruff; CI jobs run pytest splits and `ruff check .`)

## Notes
- No migration, no API/serializer change, no cache/proxy impact.
- Existing ghost rows are out of scope.
