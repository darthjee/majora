# Data model foundation page

Write `docs/agents/specs/access-statistics/data-model.md` in full, as prose with a
`Status: decided` line. Content, from #1477's Edge cases section and #1478:

- **`Session` is the visitor**, not a visit. The cookie lasts 2 years, and the session is
  reused while IP and domain match, with `last_seen_at` bumped on every request. So counting
  sessions by `created_at` measures *new* sessions, and `last_seen_at - created_at` measures
  cookie age.
- **`Visit` is the activity** (#1478): `session` FK, `started_at`, `last_seen_at`, `hits`.
  The middleware opens or extends a visit with a configurable **30-minute** inactivity window,
  and `last_seen_at`/`hits` writes are throttled (about 60 seconds, configurable). Describe it
  as *proposed in #1478*, or from the merged code if #1478 has landed. State that #1478 keeps
  this page in sync.
- **Visitor key:** `user_id` when the session has a user, otherwise the session id.
- **#1480 assumption:** a logged-in request never produces an anonymous `Session` row (outcome
  only).
- **Counting rules and caveats:**
  - proxy-cached responses never reach Django, so they are invisible;
  - an anonymous visitor whose IP changes, and a user who logs out and keeps browsing, are
    counted more than once, so "unique visitors" is an estimate;
  - `domain = NULL` is shown as an **"unknown"** bucket;
  - deleted users' sessions end up with `user = NULL` and are counted as anonymous;
  - staff traffic is counted, with no exclude-staff filter;
  - requests carrying `X-Statistics-Skip-Secret` create or update nothing.

## Files to Change

- `docs/agents/specs/access-statistics/data-model.md`: new foundation page.
