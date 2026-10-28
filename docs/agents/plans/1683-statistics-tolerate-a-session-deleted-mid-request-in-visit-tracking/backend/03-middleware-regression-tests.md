# Middleware and attachment regression tests

Prove end to end that a session deleted at each point never yields a 500, and that attachment
already copes. Simulate the race by wrapping the real function in a `unittest.mock.patch`
side effect that deletes the session first — no real concurrency needed. Reuse the existing
fixtures and helpers in `middleware_test.py` (registered `testserver` domain, cookie set up from
a first request, `UserFactory` / `Token` for authenticated requests).

`backend/statistics/tests/middleware_test.py`:

- **Deleted before the touch:** make the cookie's session stale (`last_seen_at` older than the
  touch interval), wrap `StatisticsSessionMiddleware._session_from_cookie` so it returns the
  session and then deletes its row; the request returns 200 and no `Visit` exists for that pk.
- **Deleted before the track:** wrap `statistics.middleware.track_visit` to delete the session
  and then call the real function; 200, no `Visit` for the deleted pk.
- **Deleted before user attachment:** an authenticated request on an anonymous cookie session,
  with `statistics.middleware.attach_user` wrapped to delete the session first; 200, and the
  response cookie points to a new `Session` tied to the user.
- **Stale cookie after a clear:** after a first request sets the cookie, run
  `Session.objects.all().delete()`; the next request returns 200, creates a new session (new
  token in the cookie) and opens one `Visit` on it.

`backend/statistics/tests/session_attachment_test.py`:

- `attach_user` on a deleted anonymous session (default path) returns a new `Session` tied to
  the user, with the same `ip` / `domain`, and raises nothing.
- Same with `always_rotate=True`.

Optionally, the login path (`accounts.views.auth._shared.attach_statistics_session`) goes
through `attach_user` too; one login test with the session deleted first is welcome if it fits
the existing `accounts` login tests cheaply, but is not required.

## Files to Change

- `backend/statistics/tests/middleware_test.py` — deleted-before-touch / track / attach and stale-cookie tests.
- `backend/statistics/tests/session_attachment_test.py` — deleted-session tests for both paths.
