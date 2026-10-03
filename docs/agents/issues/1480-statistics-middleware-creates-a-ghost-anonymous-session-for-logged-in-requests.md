# Issue: Statistics middleware creates a ghost anonymous Session for logged-in requests

## Description

Authentication is DRF's `accounts.authentication.CookieTokenAuthentication`, so when
`StatisticsSessionMiddleware` runs *before* the view, `request.user` is still anonymous.

This blocks accurate numbers for the staff access statistics page (#1477), which assumes this is
fixed.

## Problem

Whenever a logged-in user's request needs a **new** statistics session (IP changed, domain
changed, statistics cookie missing/invalid), the middleware:

1. creates a new `Session` with `user = NULL` (`_load_or_create_session` reads the unresolved,
   anonymous `request.user`);
2. runs the view — DRF authenticates the cookie token;
3. `_backfill_user` sees an anonymous session + authenticated user and **rotates**
   (`attach_user(..., always_rotate=True)`), creating yet another `Session` tied to the user and
   writing that one to the cookie.

The row from step 1 is a **ghost**: anonymous, served exactly one request, never reused. Every
IP/domain/cookie change of a logged-in user leaves one behind, inflating anonymous visitor
counts.

## Expected Behavior

A request from an authenticated user never produces an anonymous `Session` row: the session
created during that request ends up tied to the user, and no second row is created.

### Acceptance criteria

- [ ] A logged-in request with a changed IP/domain or missing/invalid cookie creates exactly one
      `Session`, tied to the user.
- [ ] A pre-existing anonymous session (one that existed before the request) is still never
      silently claimed by the generic backfill — it still rotates to a new row.
- [ ] `/login` and authorization-request `poll` behavior is unchanged.
- [ ] Middleware tests cover the scenarios above.

### Out of scope

- Cleaning up ghost anonymous `Session` rows already in the database — this issue only stops
  new ones from being created.

## Solution

Attach the user **in place** on sessions created during the current request:

- `StatisticsSessionMiddleware._load_or_create_session` records (e.g. via a request attribute)
  whether the session it returns was **created** during this request or **reused** from a valid
  cookie.
- `_backfill_user`:
  - session created during this request → `attach_user(session, request.user)` (no
    `always_rotate`), updating the row in place — it cannot belong to anyone else;
  - session that pre-existed the request → keep `attach_user(..., always_rotate=True)`,
    preserving the "never silently claim a lingering anonymous session on a shared device"
    guarantee; update the `_backfill_user` docstring accordingly.
- Do **not** resolve the user in the middleware before the view (no duplicated
  `CookieTokenAuthentication` logic, no extra token/profile queries per request).
- The explicit `/login` and `poll` flows (`accounts/views/auth/_shared.py::attach_statistics_session`)
  are untouched: they already attach in place, so the backfill is a no-op afterwards.
- Tests in `backend/statistics/tests/middleware_test.py`.

## Benefits

- Accurate anonymous vs. logged-in visitor counts for the staff access statistics page (#1477).
- No extra queries per request and no duplicated authentication logic.
