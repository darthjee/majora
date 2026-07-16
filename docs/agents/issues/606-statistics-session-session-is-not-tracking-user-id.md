# Issue: statistics_session is not tracking user id

## Description
The backend `statistics.Session` model tracks visits (anonymous or logged-in) via a signed cookie holding an opaque `token`, plus a nullable `user` foreign key meant to identify the visitor once authenticated. In practice, `user_id` almost never gets populated for logged-in visitors outside of the exact moment they call `/login`.

## Problem
`StatisticsSessionMiddleware._load_or_create_session` (`backend/statistics/middleware.py`) decides the session's `user` with:

```python
user = request.user if request.user.is_authenticated else None
```

This runs as plain Django middleware, **before** DRF resolves authentication for the view. The app authenticates API requests via a custom `CookieTokenAuthentication` (`backend/games/authentication.py`), resolved lazily by DRF when the view accesses `request.user` — and the login view (`backend/games/views/auth/login.py`) never calls `django.contrib.auth.login()`, only `django.contrib.auth.authenticate()` plus storing a DRF token. So the Django-level `request.user` seen by the middleware is always `AnonymousUser`, and the `is_authenticated` check above never fires.

The only place a statistics session ever gets its `user` set is `_attach_statistics_session()` in `login.py`, called once at the moment of login. Any statistics session created before login, or reused/rotated afterward (e.g. cookie cleared, IP change triggering a new `Session` row), never picks up the user again on later authenticated requests — even though those requests are correctly authenticated at the view layer.

## Expected Behavior
A statistics session should end up with its `user` set to the authenticated visitor whenever any request on that session is actually authenticated — not only at the exact moment `/login` is called. This includes requests authenticated via the `Authorization: Token` header or the session-stored `auth_token`, on any endpoint.

## Solution
Have the statistics session get backfilled from the DRF-resolved user rather than relying solely on the pre-dispatch Django `request.user`. Concretely: after `self.get_response(request)` runs in `StatisticsSessionMiddleware.__call__`, DRF has already resolved authentication for the view (and, since DRF's `Request.user` setter writes back to the underlying `HttpRequest`, the raw `request.user` passed into the middleware reflects the real authenticated user by then). If `request.statistics_session.user_id` is still `None` at that point and `request.user.is_authenticated` is now true, attach the user to the session (reusing the same "attach, or rotate if already tied to a different user" logic currently in `login.py`'s `_attach_statistics_session`, which should move to/be shared with the middleware).

This keeps the login-time behavior working as-is while generalizing it to any authenticated request, not just `/login`.

## Benefits
Statistics accurately attribute usage to the logged-in user across their whole session, not just requests made at/after the specific `/login` call, improving the reliability of any reporting built on `statistics.Session.user`.
