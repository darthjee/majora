# Tests

Add/adjust tests (pytest, `@pytest.mark.django_db`, existing `client` + `DomainFactory`
patterns from `middleware_test.py`):

- **Model**: `tests/models/visit_test.py` — defaults (`hits=1`, timestamps), cascade on
  session delete.
- **Settings**: defaults and env overrides for the two new settings.
- **Middleware / visit tracking**:
  - first request (no cookie) creates one session and one visit with `hits=1`;
  - second request inside the window extends the same visit (`hits=2`, `last_seen_at`
    advanced, no new row);
  - request after the window (age the visit via `.update(last_seen_at=...)`) opens a new visit;
  - window configurable via env (`monkeypatch.setenv`);
  - skipped request (valid skip secret) creates/updates no visit;
  - rotation: anonymous pre-existing session + authenticated request → the visit on the old
    session gets the hit, no visit on the new session yet; the next request with the new cookie
    opens a visit on the new session;
  - in-place attach (no cookie, authenticated request) → the visit stays on that same session;
  - IP change → new session, new visit.
- **Session throttle**: adapt `test_reuses_session_when_cookie_ip_matches` (age the session
  first) and add a test that a fresh session's `last_seen_at` is not rewritten; threshold
  configurable via env.
- **Admin**: `Visit` registered and read-only (add/change/delete permissions all `False`), if
  admin is already tested for `Session`; otherwise a minimal test.

## Files to Change

- `backend/statistics/tests/models/visit_test.py` — new
- `backend/statistics/tests/middleware_test.py` — visit and throttle cases, adapt reuse test
- `backend/statistics/tests/visit_tracking_test.py` — new, if the helper is extracted
- `backend/statistics/tests/settings_test.py` — new
