# Scripts page

`scripts.md` — the design for #1702 and #1703. Mark as *planned by #1702 / #1703*. Link to the
investigator agent docs (#1698) for the general rules instead of restating them.

- **Layout:** `investigations/statistics-bug/` with `README.md`, `emulate.py`, `analyse.py`,
  a standalone `docker-compose.yml`, a `.gitignore` for reports; CI (lint, tests, coverage) must
  not pick up `investigations/`.
- **`emulate.py`:** local stack only, through the proxy; refuses a production base URL; browser-like
  cookie jar applying `Set-Cookie` in response arrival order. Scenarios: first visit, sequential
  navigation, page refresh burst (with/without cookie, anonymous/logged in), login mid-navigation,
  IP change (`X-Forwarded-For`), host change, and a mix of standard-rule and custom-handler
  requests (hypothesis 1). Reports created sessions/visits via the local export endpoint.
- **`analyse.py`:** device-authorization flow (print link, wait, poll; token in memory only;
  denied/expired/revoked → clean stop, no partial report); sequential paging, narrow date range
  first; grouping (same `user_id` = high confidence; same domain + same/nearby IP + close
  timestamps = low confidence, NAT caveat); classification (parallel race, login rotation, IP
  flip, domain change, single-hit orphan, legitimate, other); report as text + JSON, git-ignored.
- **Cross-validation:** run `analyse.py` on local data produced by `emulate.py`; it must find
  exactly the duplicates each scenario produced before it is trusted on production.
- **Self-pollution:** the scripts' own requests must not create sessions — verified.

## Files to Change

- `docs/agents/specs/statistics-bug/scripts.md` — new.
