# Visit paths and docs

- `track_visit(session, *, new_session=False, path=None)`: `_open_visit` sets
  `first_path = last_path = path`; `_extend_latest_visit` adds `last_path=path` to the existing
  atomic `UPDATE` (`hits = F('hits') + 1`). No extra query. The middleware passes the route
  from step 02.
- Docs: describe the new columns, reasons, route-pattern values and the "logged at creation"
  meaning in `docs/agents/statistics.md` (Data model section). The permanent doc must not link
  into `docs/agents/specs/`.

Tests: visit `first_path`/`last_path` on open and on extend, concurrent extends still lose no
hit, the extend path keeps its query count.

## Files to Change

- `backend/statistics/visit_tracking.py` — path on open and extend.
- `backend/statistics/middleware.py` — `_track_visit` passes the route.
- `backend/statistics/tests/visit_tracking_test.py` — new tests.
- `docs/agents/statistics.md` — tracking columns documentation.
