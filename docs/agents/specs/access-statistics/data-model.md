# Data model

> **Status:** decided · **Source:** #1477 (Edge cases), #1478 · Back to the
> [hub](../access-statistics.md)

What the statistics tabs count, and the rules and caveats behind every number. This page
transcribes decisions **settled in #1477** and the final `Visit` design shipped in #1478; it
makes none of its own.

## `Session` is the visitor

`statistics.Session` (recorded by `StatisticsSessionMiddleware` in `backend/statistics`) is
long-lived: the cookie lasts 2 years, and the middleware reuses the session while the IP and
domain match. A regular user may keep a single session for months. So:

- counting sessions by `created_at` measures *new* sessions, not activity;
- `last_seen_at - created_at` measures cookie age, not time on site.

Sessions are therefore treated as the **visitor (device/browser) identity**, never as
visits. Since `Visit` carries the activity, `Session.last_seen_at` is **throttled**: it is
only rewritten when it is at least 60 seconds stale (configurable through
`Settings.session_touch_interval_seconds()`, env
`MAJORA_STATISTICS_SESSION_TOUCH_INTERVAL_SECONDS`).

## `Visit` is the activity

Activity comes from a lightweight `statistics.Visit` record under each session (#1478):

- fields: `session` (FK to `Session`, `related_name='visits'`), `started_at`,
  `last_seen_at`, `hits`;
- indexes for aggregation: `started_at` and `(session, last_seen_at)`;
- once the session is resolved (before the view runs), the middleware looks at the
  session's latest visit: if its `last_seen_at` is within the **inactivity window**, it is
  extended, otherwise (or when there is no visit yet) a new `Visit` is opened with
  `hits = 1`;
- the inactivity window defaults to **30 minutes**, configurable through
  `Settings.visit_inactivity_seconds()` (env `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS`);
- `hits` is **exact**: extending a visit is a single atomic `UPDATE`
  (`hits = hits + 1`, `last_seen_at = now`), safe under concurrent requests. Two concurrent
  requests arriving just after the window expires may both open a visit; this rare
  duplicate is accepted;
- `hits` counts **uncached backend requests, not page views**: one SPA page view may issue
  several API calls, and proxy-cached responses never reach Django;
- requests carrying `X-Statistics-Skip-Secret` create or update no visit;
- **login is a visit boundary.** When a pre-existing anonymous session is rotated to a new
  user-tied `Session` row, the current visit is **not** moved: the login request counts on
  the anonymous session's visit, which simply ends, and the next request carrying the new
  cookie opens a visit on the new session. When the user is attached in place (session
  created during the same request), the visit stays on that same session;
- **no backfill**: visit data starts at deploy; existing `Session` rows have no visits.

Visit duration is `last_seen_at - started_at`, and hits per visit is `hits`.

Per-request write cost stays about the same as before #1478: one `Visit` write instead of
one `Session` write, plus an occasional throttled `Session` write.

## Visitor key

One person can own several `Session` rows (devices, browsers, IP changes). The **visitor
key** is `user_id` when the session has a user, otherwise the session id. This dedupes a
logged-in user across devices, browsers and IP changes.

## Assumption on #1480

The spec assumes #1480 is fixed: **a logged-in request never produces an anonymous
`Session` row** (no ghost anonymous sessions). Only this outcome is assumed; the fix
mechanism is #1480's own choice.

## Counting rules and caveats

- **Proxy-cached responses are invisible.** Requests served from the Tent cache never reach
  Django, so anonymous traffic on cached public routes is undercounted.
- **"Unique visitors" is an estimate.** An anonymous visitor whose IP changes, and a user
  who logs out and keeps browsing, are counted as more than one visitor.
- **Null domains** (`domain = NULL`, unrecognized host) are shown as an **"unknown"** domain
  bucket, never dropped.
- **Deleted users** leave sessions with `user = NULL`, which are counted as anonymous. This
  is accepted.
- **Staff traffic is counted**, including visits to the statistics page itself. There is no
  "exclude staff" filter.
- **Skipped requests** (carrying `X-Statistics-Skip-Secret`) create or update nothing.
- **Times are stored in UTC.** Ranges and buckets are computed in the browser's time zone
  (see [shared infrastructure](shared-infrastructure.md)).
