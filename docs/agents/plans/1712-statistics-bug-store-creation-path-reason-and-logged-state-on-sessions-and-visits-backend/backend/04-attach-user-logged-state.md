# Logged state and rotation in attach_user

Extend `attach_user(session, user, *, always_rotate=False, created_in_request=False,
first_path=None)`:

- **In-place attach:** the existing atomic `UPDATE` (`filter(pk, user_id__isnull=True)`) also
  sets `first_seen_logged=True` when `created_in_request` is true — same statement, no extra
  query; mirror it on the instance. An in-place attach to a session from an earlier request
  leaves `first_seen_logged` unchanged.
- **Rotation:** the new row is created with `creation_reason=login_rotation`,
  `first_seen_logged=True` and `first_path` = the rotating request's route.

Callers pass the request context:

- middleware `_backfill_user`: `created_in_request=self._created_during_request(...)`,
  `first_path=request.statistics_route`;
- `accounts.views.auth._shared.attach_statistics_session` (login view and device-authorization
  poll): `created_in_request` from `request.statistics_session_created`, `first_path` from the
  request's stored route (use the underlying `HttpRequest` attributes, as
  `_set_statistics_session` already does).

Tests: `first_seen_logged` for anonymous, logged-in at creation, in-place attach in the
creating request (middleware back-fill, login view, poll), in-place attach to an earlier
anonymous session (stays `false`), rotation (`login_rotation`, `true`, rotating route; the poll
route stores no `uuid`); lost in-place race still rotates.

## Files to Change

- `backend/statistics/session_attachment.py` — new keyword arguments.
- `backend/statistics/middleware.py` — `_backfill_user` passes the context.
- `backend/accounts/views/auth/_shared.py` — `attach_statistics_session` passes the context.
- `backend/statistics/tests/session_attachment_test.py`, `backend/statistics/tests/middleware_test.py`,
  login/poll view tests under `backend/accounts/tests/` — new cases.
