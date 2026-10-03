# Data model

> **Status:** decided · **Source:** #1477 (Edge cases), #1478 · Back to the
> [hub](../access-statistics.md)

What the statistics tabs count, and the rules and caveats behind every number. This page
transcribes decisions **settled in #1477**; it makes none of its own. #1478 keeps it in sync
with the final `Visit` design.

## `Session` is the visitor

`statistics.Session` (recorded by `StatisticsSessionMiddleware` in `backend/statistics`) is
long-lived: the cookie lasts 2 years, and the middleware reuses the session while the IP and
domain match, bumping `last_seen_at` on every request. A regular user may keep a single
session for months. So:

- counting sessions by `created_at` measures *new* sessions, not activity;
- `last_seen_at - created_at` measures cookie age, not time on site.

Sessions are therefore treated as the **visitor (device/browser) identity**, never as
visits.

## `Visit` is the activity

Activity comes from a lightweight `statistics.Visit` record under each session, **as
proposed in #1478** (not yet merged at the time of writing):

- fields: `session` (FK to `Session`), `started_at`, `last_seen_at`, `hits`;
- once the session is resolved, the middleware looks at the session's latest visit: if its
  `last_seen_at` is within the **inactivity window**, it bumps `last_seen_at` and `hits`,
  otherwise it opens a new `Visit`;
- the inactivity window defaults to **30 minutes**, configurable through
  `statistics.settings.Settings`;
- `last_seen_at` / `hits` writes are **throttled** (about 60 seconds, configurable); #1478's
  plan decides whether `hits` stays exact or is approximate;
- the behavior on login rotation (whether the current visit moves to the new session or a
  new visit starts) is decided in #1478's plan;
- requests carrying `X-Statistics-Skip-Secret` create or update no visit;
- indexes for aggregation (e.g. `started_at`, `(session, last_seen_at)`).

Visit duration is `last_seen_at - started_at`, and hits per visit is `hits`. If #1478's final
design differs from the above, #1478 updates this page in the same PR.

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
