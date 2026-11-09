# Issue: Statistics bug fix: backend session tracking fix

## Description

Part of the statistics bug fix Epic (Epic #1736). Fix the backend session tracking so
the infrastructure IP, unresolved routes and the login-rotation race no longer create extra
statistics sessions.

Background: `docs/agents/specs/statistics-bug/findings.md` (root cause, reproducing scenarios,
regression test scenario) and `docs/agents/statistics.md`.

## Problem

- `StatisticsSessionMiddleware._load_or_create_session` only reuses a cookie-borne session while
  `session.ip` matches the request IP, so an IP change opens an `ip_changed` session. With the
  infrastructure IP rotating, that meant one session per request.
- Requests to unresolved routes (404 on unknown `.json` paths) are tracked, and automated
  traffic to them produced most of the inflated sessions.
- `_backfill_user` always rotates a pre-existing anonymous session for an authenticated request,
  so parallel authenticated requests carrying the same anonymous cookie each create a
  `login_rotation` session (race 2b).

## Expected Behavior

- Unresolved routes (404 on unknown paths) create or touch no statistics session.
- A valid signed cookie from a different IP **reuses** its session and updates the session's IP
  (owner decision: the per-IP session boundary is given up on purpose). The IP change stays
  visible on the `Visit` (see [IP change visibility](#ip-change-visibility)).
- Parallel authenticated requests with one anonymous cookie create **no** `login_rotation`
  session: the first one attaches the user in place, the others reuse the session.
- The `login_mid_navigation` open point from #1704 is closed: it is not a bug (see
  [Emulation expectations](#emulation-expectations)).

## Solution

Change `backend/statistics/` (middleware, session attachment) accordingly. `ip_changed` stops
being produced for a valid cookie; keep the value readable for existing rows.

### Unresolved routes

- `StatisticsSessionMiddleware.__call__` computes the route pattern first; a request whose path
  matches no route (`route_pattern()` returns `unresolved`) is handled like a skipped request:
  `request.statistics_session = None`, no domain or session lookup, no visit, no `Set-Cookie`.
  An existing session carried by the cookie is not touched (`last_seen_at`, visits, IP).
- The `unresolved` marker stays readable for existing rows; nothing writes it any more.
- `APPEND_SLASH` redirects: the slash-less request is skipped, the redirected one is tracked.
- **Out of scope:** a route that resolves but whose view returns 404 (e.g. an unknown slug) is
  still tracked; skipping it would require deciding after the view runs. The #1704 data shows
  the inflation came from unresolved paths.

### IP change visibility

- **Migration:** `Visit.first_ip` and `Visit.last_ip` (`GenericIPAddressField`, nullable, no
  backfill; existing visits stay `NULL` = unknown), mirroring `first_path`/`last_path`.
- `first_ip` and `last_ip` are set when a visit opens; `last_ip` is updated in the same atomic
  `UPDATE` that already does `hits = hits + 1` (no extra query). An IP change inside a visit
  shows as `first_ip ≠ last_ip`; intermediate IPs are not kept. An IP change never closes or
  opens a visit.
- `Session.ip` becomes the **last seen IP**: updated only when it differs from the stored value
  (known in memory, so no extra write for normal traffic), folded into the `_touch_session`
  write when possible. A rotated session copies the IP as today.
- **Staff API:** the visit list (`staff_statistics_visit.py`) returns `first_ip`/`last_ip`
  instead of `session.ip` (which would show the newest IP on old visits); the export includes
  them too. `data-access` reviews the field change.
- Showing them in the staff UI is #1745.

### Race 2b (login rotation)

How it happens: the browser holds a token while its statistics cookie points to an
**anonymous** session S (e.g. S was created by a request whose user was never resolved, such as
a non-DRF view or a 404, or after the cookie was reset). A page load then fires N authenticated
requests in parallel, all carrying S. Each one sees S as pre-existing and anonymous, so
`_backfill_user` rotates it (`always_rotate`) and inserts its own `login_rotation` session; the
browser keeps the last `Set-Cookie` and the others are orphaned.

Decision (option a): `_backfill_user` attaches the user to a pre-existing anonymous session
**in place**, with the same atomic `UPDATE … WHERE user_id IS NULL` the login view already
uses (`attach_statistics_session`). Only one request wins; the others then find S tied to the
same user and **reuse** it. A session tied to a **different** user still rotates. The
shared-device protection given by always rotating is dropped on purpose: the login view
already claims the anonymous session in place.

Security review (done while refining this issue): no high or medium risk. The statistics session
grants no authorization and only staff read it, so planting or stealing a cookie leaks nothing.
Accepted trade-offs and required follow-ups:

- On a shared device, anonymous visits made before a login are attributed to the user who
  authenticates first. This already happens through the login view, so the change adds no new
  vector. Document the trade-off in the `_backfill_user` docstring and `docs/agents/statistics.md`.
- The same-user reuse must rely on the result of the atomic `UPDATE` (or re-read `user_id`),
  never on a stale in-memory `user_id = None`.
- `Session.ip` becomes the last seen IP. A stolen cookie now works from any IP, but it only lets
  the thief add visits to the victim's statistics. The missing `Secure` attribute is tracked in
  #1733.
- A cached response replaying `Set-Cookie` would merge visitors now that the IP check is gone.
  Already ruled out by #1704 (Tent's `FileCacheMiddleware` strips `Set-Cookie`, hypothesis 5);
  the plan re-confirms it.

### Regression tests (required, failing before the fix)

- One signed cookie on consecutive requests with different client IPs reuses a single session —
  once with the IP trusted through the proxy (`X-Forwarded-For` + `X-Proxy-Secret`) and once
  untrusted (`REMOTE_ADDR` only, as on the direct host).
- A request to an unresolved route creates no session.
- A parallel burst of authenticated requests carrying one anonymous cookie creates no
  `login_rotation` session and leaves the user attached to that one session.
- A pre-existing anonymous session is attached in place; one already tied to the same user is
  reused; one tied to a different user still rotates.
- Logout still deletes the statistics cookie.
- A request to an unresolved path with an existing cookie leaves that session untouched
  (`last_seen_at`, visits, IP) and sets no cookie.
- A visit opened and extended from two IPs records `first_ip` and `last_ip`; `Session.ip`
  ends up as the last IP.

### Edge cases and compatibility

- **`domain_changed`:** the split is kept (a different host is a different site context; not
  involved in the bug).
- **Concurrent IP updates:** last write wins on `Session.ip` and `Visit.last_ip`; no locking.
- **`ip_changed`:** stays in `CreationReason`, so existing rows, the frontend label and
  `analyse.py` keep working; nothing produces it for a valid cookie any more.
- No data migration and no merging of already-duplicated sessions; the new visit columns are
  nullable.
- **Performance:** no query added per request. `Session.ip` is written only when it changes,
  `Visit.last_ip` rides in the existing `UPDATE`, and unresolved routes skip the domain and
  session queries.
- **Permissions:** unchanged; statistics stay staff-only.

### Emulation expectations

**`login_mid_navigation` explained:** the scenario creates an anonymous session S, then logs in
through `/users/login.json`. The login view (`attach_statistics_session`) calls `attach_user`
without `always_rotate`, so the user is attached to S **in place** and the following
authenticated requests reuse S. No `login_rotation` session is the intended behaviour; the
scenario's expectation (one `login_rotation`) was wrong.

The post-fix check (#1741) re-runs `emulate.py` and expects the post-fix behaviour, so this
issue updates the scenarios' `Expect` values together with the fix (like tests):

- `login_mid_navigation`: 0 `login_rotation` sessions;
- `refresh_burst_with_cookie_logged_in`: 0 `login_rotation` sessions;
- `ip_change`: 0 `ip_changed` sessions, the session is reused;
- `mixed_handlers`: 0 `ip_changed` sessions (the cookie reuse covers it; #1738 also stops the
  IP flip itself).

Also update the scenario table in `investigations/statistics-bug/README.md`, and close the
`login_mid_navigation` open point in `docs/agents/specs/statistics-bug/findings.md`.

Existing tests asserting `ip_changed` for a valid cookie or the always-rotate behaviour are
updated to the new rules, not deleted. The local `emulate.py` run belongs to #1741.

### Out of scope

- Showing the visit IPs in the staff UI (#1745).
- Tent custom handlers forwarding the client IP (#1738).
- Stopping the direct host (#1739).
- Race 2a, resolved routes returning 404, and cleaning up already-duplicated sessions.

### Docs

Update `docs/agents/statistics.md` with the new reuse rules (IP change, unresolved routes, login
rotation). Untracked requests become: an exact `UNTRACKED_PATHS` match, a valid skip header, or
no matching route.

### Reviews

`security` and `data-access` review the change (session/visibility logic).

## Privacy

The repository is public: no real IPs, ids, tokens, secrets or production hostnames in this
issue or its PR.

### Responsible agents

- **backend:** `backend/statistics/`, the staff serializers, the migration and
  `docs/agents/statistics.md`.
- **investigator:** `investigations/statistics-bug/` (scenario expectations, README) and the
  `findings.md` open point.
