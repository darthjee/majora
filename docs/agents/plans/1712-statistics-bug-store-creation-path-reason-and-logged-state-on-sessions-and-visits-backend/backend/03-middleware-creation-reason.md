# Creation reason and first path in the middleware

In `StatisticsSessionMiddleware`:

- `_session_from_cookie` returns the session **and** a lookup outcome: no cookie →
  `no_cookie`; unsign fails → `invalid_cookie`; no row for the token →
  `cookie_session_not_found`. The lookup becomes `Session.objects.filter(token=token).first()`
  (token is unique: still one query, replacing the token + domain filter).
- `_load_or_create_session` keeps the exact reuse rule (same IP **and** same `domain_id`). When
  it creates a row, the reason is the lookup outcome, or — when a session was found — 
  `domain_changed` if the domain differs (checked first, so both changed → `domain_changed`),
  otherwise `ip_changed`.
- The created row gets `creation_reason`, `first_path` (the route pattern from step 02) and
  `first_seen_logged = user is not None`, all in the same `INSERT`.

Tests (in `middleware_test.py`): each reason, both domain and IP changed → `domain_changed`, a
cookie for another domain is still not reused, the cookie lookup is a single query
(`django_assert_num_queries`), untracked/skip requests store nothing, existing reuse tests
unchanged.

## Files to Change

- `backend/statistics/middleware.py` — lookup outcome, reason, first path on create.
- `backend/statistics/tests/middleware_test.py` — new tests.
