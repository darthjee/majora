# Issue: Add statistics

## Description
Introduce a new backend module, `statistics`, that collects usage data about how the application is accessed, by both logged-in and anonymous users. For now, the scope is limited to data collection only; no reporting or presentation layer is included in this issue.

## Problem
There is currently no way to know how users (logged in or anonymous) access the application: how often, across which visits, or from where. This makes it impossible to answer basic usage questions or to build future reporting/analytics on top of that data.

## Expected Behavior
- A new `statistics` session is tracked per visitor, independent of the existing authentication session/token (`games.authentication.CookieTokenAuthentication`).
- On every request:
  - If a valid session token is found in a signed cookie, the matching session is loaded.
  - If not, a new session is created and its token is stored (signed) in a cookie.
- Every access bumps the session’s `last_seen_at` timestamp.
- Each session stores a `user_id`, which is `null` for anonymous visitors.
- IP address is tracked per session, read from a trusted proxy header (e.g. `X-Forwarded-For`, as set by Tent) falling back to `REMOTE_ADDR`.
  - If the IP recorded on the session ever changes, a new session is started (a fresh token/cookie is issued) instead of updating the existing session’s IP.
- Login behavior:
  - If the current session has no `user_id`, it is updated with the logging-in user’s id.
  - If the current session already has a `user_id` set, login always creates a brand new session instead of reusing it — even if it is the same user logging in again.
- Logout removes the session cookie, so the next access creates a fresh session.
- Geolocation (region) tracking is out of scope for this issue — deferred to a follow-up issue once basic session tracking is in place, to separately evaluate geo-IP providers and their cost.

## Solution
- New top-level Django app `statistics` (structural precedent: `backend/versioning/`), with its own `Session` model and migrations.
- A request middleware (same shape as `games.middleware.CacheControlMiddleware`) reads/writes the statistics cookie on every request and updates `last_seen_at`.
- Cookie value is a signed session token via Django’s built-in `django.core.signing`, separate from the existing `sessionid`/`auth_token` cookies used for authentication.
- IP capture relies on a trusted proxy header forwarded by Tent (falling back to `REMOTE_ADDR`); confirm/add the corresponding Tent proxy rule if it does not already forward the client IP.

## Benefits
- Lays the groundwork for future usage analytics/reporting (active users, retention, geographic distribution).
- Establishes a reusable session-tracking pattern, decoupled from authentication.
