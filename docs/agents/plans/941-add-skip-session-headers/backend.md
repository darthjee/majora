# Backend Plan: Add skip session headers

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads env var `STATISTICS_SKIP_SECRET` (empty/unset means the feature is disabled — always fall through to normal recording).
- Recognizes request header `X-Statistics-Skip-Secret` (`request.META['HTTP_X_STATISTICS_SKIP_SECRET']`). When it's present, non-empty, and matches the configured secret via `secrets.compare_digest`, statistics-session recording is skipped for that request: no `Session` row, no cookie. Any other combination (header missing, wrong, or secret unconfigured) behaves exactly like today, with no distinguishable response.
- Does not depend on cache/infra work to be functional — this can be implemented, tested, and merged independently; it stays inert until the env var is actually set.

## Implementation Steps

### Step 1 — Add the secret setting

In `backend/statistics/settings.py`, add a `skip_secret()` static method next to `cookie_max_age_seconds()`:

```python
@staticmethod
def skip_secret():
    """Return the configured statistics-skip secret, or '' if unset (feature disabled)."""
    return os.environ.get('STATISTICS_SKIP_SECRET', '')
```

Add `import os` at the top of the file (not currently imported there).

### Step 2 — Add the header check to the middleware

In `backend/statistics/middleware.py`, add a helper and an early-exit branch at the top of `__call__` (before the existing `ip = self._client_ip(request)` line):

```python
def __call__(self, request):
    if self._skip_requested(request):
        request.statistics_session = None
        return self.get_response(request)

    ip = self._client_ip(request)
    ...
```

```python
def _skip_requested(self, request):
    """Return whether this request carries a valid statistics-skip header."""
    secret = Settings.skip_secret()
    header = request.META.get('HTTP_X_STATISTICS_SKIP_SECRET')
    if not secret or not header:
        return False
    return secrets.compare_digest(header, secret)
```

Add `import secrets` at the top of `middleware.py`. Guard against `TypeError` from `compare_digest(None, ...)` by checking `not secret or not header` first — this also makes an unconfigured secret ('') always short-circuit to "no skip", satisfying the fail-safe requirement from the issue.

### Step 3 — Guard the other two `request.statistics_session` consumers

`request.statistics_session` can now be `None`. Two other call sites read it unconditionally and must no-op gracefully instead of crashing when a skip-flagged request also happens to hit an authenticated endpoint:

- `_backfill_user` in `backend/statistics/middleware.py` (currently `session = request.statistics_session; if session.user_id is not None or ...`): add `if session is None: return` as the first line of the method.
- `attach_statistics_session` in `backend/accounts/views/auth/_shared.py` (currently `session = request.statistics_session; new_session = attach_user(session, user)`): add `if session is None: return` right after fetching `session`.

### Step 4 — Tests

Add to `backend/statistics/tests/middleware_test.py`, following the existing style (Django test `client`, `HTTP_X_...=` kwargs, `pytest.mark.django_db`, `monkeypatch` fixture):

1. `test_skips_session_when_valid_skip_header_present` — `monkeypatch.setenv('STATISTICS_SKIP_SECRET', 'shh')`, `client.get(..., HTTP_X_STATISTICS_SKIP_SECRET='shh')` → assert `Session.objects.count() == 0` and no statistics cookie in the response.
2. `test_creates_session_when_skip_header_missing` — secret configured via monkeypatch, no header sent → session created as today.
3. `test_creates_session_when_skip_header_wrong_value` — secret configured, header sent with a different value → session created, no crash.
4. `test_creates_session_when_skip_secret_not_configured` — secret left unset, header sent with some value → session still created (covers the fail-safe guard and the `compare_digest(None, ...)` `TypeError` avoidance).
5. `test_no_crash_when_skip_header_used_on_authenticated_request` — mirror `test_backfills_user_on_anonymous_session_when_request_is_authenticated`'s use of `HTTP_AUTHORIZATION`, add the skip header → 200 response, `Session.objects.count() == 0`, exercises the `_backfill_user` `None` guard.

Add a corresponding test near the `/login` view's existing tests (or a new small test module colocated with `accounts/views/auth/_shared.py`'s existing tests) for `attach_statistics_session`: hit `/login` with valid credentials and the skip header present → login still succeeds (200/token issued), no crash, `Session.objects.count() == 0`.

## Files to Change

- `backend/statistics/settings.py` — add `skip_secret()` and `import os`.
- `backend/statistics/middleware.py` — add `_skip_requested`, early-exit branch in `__call__`, `None`-guard in `_backfill_user`, `import secrets`.
- `backend/accounts/views/auth/_shared.py` — add `None`-guard in `attach_statistics_session`.
- `backend/statistics/tests/middleware_test.py` — new test cases (see Step 4).
- A test file exercising `attach_statistics_session`'s `/login` path with the skip header (new or existing, wherever `/login`'s current tests live).

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `backend/statistics/tests/`.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint.

## Notes

- Header name in Django's `request.META` form is `HTTP_X_STATISTICS_SKIP_SECRET` (Django uppercases and prefixes `HTTP_`, converting `-` to `_`) — confirm this exact key when implementing, it's easy to typo.
- No migration needed — this issue adds no new fields or models.
