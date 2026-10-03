# Issue: Track visits per statistics session

## Description

Prerequisite for the staff access statistics page (#1477).

Add a lightweight `statistics.Visit` record under each `statistics.Session`, so the
statistics page can count real activity (visits, visit duration, hits per visit) instead of
sessions.

## Problem

`statistics.Session` is not a visit: the cookie lives 2 years and the middleware reuses a
session while the IP and domain match, bumping `last_seen_at` on every request. A regular user
may have a single session spanning months. So:

- counting sessions by `created_at` measures *new* sessions, not activity;
- `last_seen_at - created_at` measures cookie age, not time on site.

`Session` is therefore treated as the **visitor (device/browser) identity**, and activity needs
its own record.

## Expected Behavior

- Every non-skipped request that reaches Django is attributed to a `Visit` of the resolved
  session: the latest visit is extended if it is still inside the inactivity window, otherwise
  a new visit is opened.
- Visit duration is `last_seen_at - started_at`; `hits` is the **exact** number of requests in
  the visit.
- `hits` counts **uncached backend requests**, not page views: one SPA page view may issue
  several API calls, and proxy-cached responses never reach Django. This is documented, not
  corrected.
- Per-request write cost stays roughly at today's level (see Write cost below).
- Visit data starts at deploy: **no backfill** from existing `Session` rows.

## Solution

### Model

- New model `statistics.Visit`: `session` (FK to `Session`), `started_at`, `last_seen_at`,
  `hits`.
- Indexes for aggregation: `started_at` and `(session, last_seen_at)`.
- Registered in the Django admin like `Session`.

### Middleware

In `StatisticsSessionMiddleware`, once the session is resolved, look at the session's latest
visit:

- if its `last_seen_at` is within the **inactivity window** → extend it;
- otherwise (or no visit yet) → open a new `Visit` (`hits = 1`).

The inactivity window defaults to **30 minutes**, configurable via
`statistics.settings.Settings` (env var, same pattern as the existing settings).

Requests that skip statistics (`X-Statistics-Skip-Secret`) create/update no visit.

### Write cost (decided)

- **Visit: exact `hits`.** Extending a visit is a single atomic `UPDATE`
  (`hits = F('hits') + 1`, `last_seen_at = now`) — no read-modify-write, safe under
  concurrent requests.
- **Session: throttled.** Since `Visit` now carries activity, `Session.last_seen_at` is only
  written when it is at least ~60 seconds stale (threshold configurable via `Settings`).
  Net writes per request stay about the same as today (one Visit write instead of one
  Session write, plus an occasional Session write).
- Two concurrent requests arriving just after the window expires may both open a visit; this
  rare duplicate is accepted.

### Login rotation (decided)

When `_backfill_user` rotates a pre-existing anonymous session to a new `Session` row, the
current visit is **not** moved. The login request itself counts on the anonymous session's
visit, which simply ends; the next request carries the new cookie, resolves the new session
and opens a new visit naturally. Login is a visit boundary, keeping anonymous vs logged-in
activity cleanly attributed. When the user is attached **in place** (session created during
the same request), the visit stays on that same session.

### Out of scope

- Per-request hit log (path, method, status) — a possible future extension on top of `Visit`.
- Retention / purging.
- Counting proxy-cached responses (they never reach Django — a known caveat).
- Backfilling visits for existing sessions.

### Acceptance criteria

- [ ] `Visit` model + migration (with the indexes above), registered in the Django admin like
      `Session`.
- [ ] Middleware opens/extends visits per the inactivity window, with exact `hits` via an
      atomic update; window and Session write throttle are configurable via `Settings`.
- [ ] `Session.last_seen_at` is written only when stale beyond the throttle threshold.
- [ ] Skipped requests do not touch visits; login rotation behaves as described above.
- [ ] Backend tests cover new visit, extended visit, window expiry, skip, rotation (pre-existing
      session → next request opens a visit on the new session), in-place attach, and the
      Session throttle.
- [ ] Update the access statistics spec (`docs/agents/specs/access-statistics/data-model.md`)
      with the final design: exact `hits` (uncached backend requests, not page views), the
      Session throttle, the login-rotation behavior, and no backfill.
- [ ] Create `docs/agents/access-control/statistics.md` (linked from
      `docs/agents/access-control.md`) covering `statistics.Session` and `statistics.Visit`: no
      API endpoints, writes only from `StatisticsSessionMiddleware`, readable only through the
      Django admin, and nothing exposed to players or DMs. This closes the existing gap, since
      `Session` has no access-control page today.

## Benefits

Enables in #1477: visits per day/week; real **visit duration**; hits per visit; active visitors
per day (distinct sessions/users with a visit that day); returning vs new visitors — without
increasing per-request database writes.
