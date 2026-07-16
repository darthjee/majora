# Backend Plan: Add statistics

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — this agent trusts `X-Forwarded-For` (set by Tent,
falling back to `REMOTE_ADDR`) as the visitor's IP; it does not implement any header handling
itself, only reads what `proxy` guarantees is trustworthy.

## Implementation Steps

### Step 1 — New `statistics` app

Create `backend/statistics/` mirroring `backend/versioning/`'s minimal shape:

- `__init__.py`
- `apps.py` — `StatisticsConfig(AppConfig)`, `name = 'statistics'`,
  `default_auto_field = 'django.db.models.BigAutoField'`.
- `admin.py` — register `Session` read-only (list/view only, no add/change/delete), same
  rationale and pattern as `versioning/admin.py`'s historical-model registrations: this data is
  collected automatically, never hand-edited.
- `migrations/__init__.py`.
- `tests/__init__.py`.

Register `'statistics'` in `INSTALLED_APPS` (`backend/majora_project/settings.py`), after
`'versioning'`.

### Step 2 — `Session` model

`backend/statistics/models.py`:

```python
class Session(models.Model):
    token = models.CharField(max_length=64, unique=True, db_index=True, default=_generate_token)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='statistics_sessions',
    )
    ip = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
```

- `_generate_token()` — module-level function, `secrets.token_urlsafe(32)`. A plain callable
  default (not a lambda) so Django migrations can serialize it.
- `user` is nullable to represent an anonymous visitor, per the issue's "`user_id` null when not
  logged" requirement. `on_delete=SET_NULL` (not `CASCADE`) — deleting a `User` account must not
  destroy the historical access record.
- No `unique_together`/uniqueness constraint on `(user, ip)` or similar — the whole point is that
  multiple `Session` rows can legitimately share a `user`/`ip` over time (each rotation creates a
  new row).

### Step 3 — Cookie signing helper

`backend/statistics/cookies.py`:

- `COOKIE_NAME = 'majora_statistics'`.
- `_signer()` — returns `django.core.signing.Signer(salt='statistics.session')`, keeping this
  signature namespace-separated from any other use of `SECRET_KEY`-based signing in the project
  (there is none today, so this is the first).
- `sign(token: str) -> str` / `unsign(value: str) -> str | None` — `unsign` catches
  `django.core.signing.BadSignature` and returns `None` (tampered/garbage cookie treated the same
  as "no cookie").

### Step 4 — `StatisticsSessionMiddleware`

`backend/statistics/middleware.py`, same `__init__(self, get_response)` / `__call__(self,
request)` shape as `games.middleware.CacheControlMiddleware`:

1. Compute `ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')`.
2. Read the incoming cookie (`request.COOKIES.get(cookies.COOKIE_NAME)`), `unsign` it, and try
   `Session.objects.get(token=token)`. Treat a missing cookie, a failed `unsign`, or
   `Session.DoesNotExist` identically — all three mean "no valid current session".
3. If a valid session was loaded but `session.ip != ip`, treat it the same as "no valid current
   session" (do not reuse it, do not mutate its `ip`) — this is the IP-rotation rule.
4. If there is no valid current session: create one —
   `Session.objects.create(ip=ip, user=request.user if request.user.is_authenticated else None)`.
   Otherwise, reuse the loaded session and touch it: `session.save(update_fields=['last_seen_at'])`
   (relies on `auto_now`).
5. Attach `request.statistics_session = session` **before** calling `self.get_response(request)`,
   so views (Step 5) can read/reassign it.
6. After `response = self.get_response(request)`, set the cookie from whatever
   `request.statistics_session` currently points to (a view may have swapped it — see Step 5):
   `response.set_cookie(cookies.COOKIE_NAME, cookies.sign(request.statistics_session.token),
   max_age=<configurable, see Step 7>, httponly=True, samesite='Lax', secure=<same
   env-driven flag as SESSION_COOKIE_SECURE>)`.

Register the middleware in `MIDDLEWARE` (`backend/majora_project/settings.py`) directly after
`'django.contrib.auth.middleware.AuthenticationMiddleware'` — it needs `request.user`, and must
run before the view executes for Step 5 to have a session to work with.

### Step 5 — Login/logout hooks

`backend/games/views/auth/login.py`, after the existing `token, _ =
Token.objects.get_or_create(user=user)` / before returning the response:

- `session = request.statistics_session`.
- If `session.user_id is None`: `session.user = user; session.save(update_fields=['user'])`.
- Else (session already tied to a `user_id` — including the same user logging in again, per the
  issue's explicit "always" rule): create a new session —
  `request.statistics_session = Session.objects.create(ip=session.ip, user=user)`. The
  middleware's Step 4.6 cookie write-back reads `request.statistics_session` *after* the view
  returns, so reassigning it here is sufficient to make the response carry the new session's
  cookie — no direct cookie manipulation needed in the view itself.

`backend/games/views/auth/logout.py`, before `return Response(status=204)`:

- `response = Response(status=204)`
- `response.delete_cookie(cookies.COOKIE_NAME)`
- `return response`

(DRF's `Response` is a `SimpleTemplateResponse` subclass, so `delete_cookie` is available
directly — no new import beyond `statistics.cookies`.)

### Step 6 — Settings

`backend/statistics/settings.py`, following `games/settings.py`'s `Settings` class pattern:

```python
@staticmethod
def cookie_max_age_seconds():
    """Return the statistics cookie's max-age, in seconds (default: 2 years)."""
    try:
        return int(os.environ.get('MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS', 60 * 60 * 24 * 365 * 2))
    except (ValueError, TypeError):
        return 60 * 60 * 24 * 365 * 2
```

Add `MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS` to `.env.dev.sample` as a placeholder, per the
project's convention for every env-driven setting.

### Step 7 — Tests

- `backend/statistics/tests/models/session_test.py` — `token` is unique/auto-generated; `user`
  nullable; `on_delete=SET_NULL` (deleting the linked `User` leaves the `Session` row with
  `user=None`, doesn't delete it).
- `backend/statistics/tests/cookies_test.py` — `sign`/`unsign` round-trip; `unsign` returns `None`
  for a tampered or garbage value.
- `backend/statistics/tests/middleware_test.py`:
  - No cookie → new session created, cookie set on the response.
  - Valid cookie, same IP → same session reused, `last_seen_at` bumped, no new row created.
  - Valid cookie, different IP → new session created (old row untouched, new row has the new IP),
    new cookie value set.
  - Tampered/garbage cookie value → treated as no session (new one created), not a 500.
  - `X-Forwarded-For` present → used over `REMOTE_ADDR`.
- `backend/games/tests/auth/login_test.py` — extend with: fresh anonymous session (`user_id`
  `None`) gets `user` set on login and *keeps the same token/cookie*; a session that already has a
  `user_id` gets a brand-new session/cookie on login (assert the pre-login and post-login cookie
  values differ), including when it's the same user logging in again.
- `backend/games/tests/auth/logout_test.py` — extend with: the response carries a `Set-Cookie`
  header deleting the statistics cookie.

## Files to Change

- `backend/majora_project/settings.py` — add `'statistics'` to `INSTALLED_APPS`; register
  `StatisticsSessionMiddleware` in `MIDDLEWARE`.
- `backend/statistics/__init__.py`, `apps.py`, `admin.py`, `models.py`, `cookies.py`,
  `middleware.py`, `settings.py` — new.
- `backend/statistics/migrations/__init__.py` + initial migration — new.
- `backend/statistics/tests/__init__.py`, `models/session_test.py`, `cookies_test.py`,
  `middleware_test.py` — new.
- `backend/games/views/auth/login.py` — attach/rotate the statistics session on login.
- `backend/games/views/auth/logout.py` — delete the statistics cookie on logout.
- `backend/games/tests/auth/login_test.py`, `logout_test.py` — extended coverage.
- `.env.dev.sample` — add `MAJORA_STATISTICS_COOKIE_MAX_AGE_SECONDS` placeholder.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info`
  (CI job: `pytest_all`) — covers the new `statistics/tests/` folder (same job that already
  covers `versioning/tests/`, no CircleCI config change needed).
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers the `login_test.py`/`logout_test.py` changes (auth views live
  under `games/tests/auth/`, routed to this job the same way they are today).
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes

- The statistics session is intentionally a *separate* concept from
  `games.authentication.CookieTokenAuthentication`'s `auth_token`/Django-session cookie — no
  shared storage, no shared cookie. Mixing them would tie collection to the auth mechanism's
  lifecycle (e.g. `request.session.flush()` on logout) instead of the explicit rules the issue
  asks for (IP-based rotation, "new session on login if already tied to a user").
- IP-change rotation deliberately never updates `session.ip` in place — the old row is left as a
  closed-out historical record of "this session, at this IP, until it changed."
- `SET_NULL` (rather than `CASCADE`) on `Session.user` is a deliberate product-data choice:
  statistics rows are activity history, not user-owned data that should vanish with the account.
