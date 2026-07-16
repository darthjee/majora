# Plan: Add statistics

Issue: [405-add-statistics.md](../../issues/405-add-statistics.md)

## Overview

Add a new top-level Django app, `statistics` (structural precedent: `backend/versioning/`),
that tracks one "statistics session" per visitor (logged in or anonymous), independent of the
existing `games.authentication.CookieTokenAuthentication` auth flow. A new
`StatisticsSessionMiddleware` runs on every request: it loads the session from a signed cookie
token (or creates a new one), bumps `last_seen_at`, and rotates to a brand-new session whenever
the visitor's IP changes. `login`/`logout` (`backend/games/views/auth/`) get small hooks to
attach/detach the session's `user` and to clear the cookie on logout. Geolocation is explicitly
out of scope (deferred to a follow-up issue per the issue file).

Because no code in this repo currently reads a trusted client IP (Tent sits in front of Django
and nothing forwards it today), this plan also adds a small Tent proxy middleware that injects
the real client address into a header Django can trust — this is the one place the plan crosses
from `backend` into `proxy`.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)

## Shared contracts

### `X-Forwarded-For` request header (Tent → Django)

- Tent sets `X-Forwarded-For` to its own view of the client's remote address (PHP's
  `$_SERVER['REMOTE_ADDR']` at the proxy) on every request forwarded to the backend
  (`http://backend:8080`, see `proxy/dev_configuration/rules/backend.php` /
  `proxy/prod_configuration/rules/backend.php`).
- Tent must **overwrite**, never append to, any `X-Forwarded-For` value the client already sent
  — otherwise a client could spoof the header and force the backend to treat a forged IP as
  trusted. There is exactly one hop (client → Tent → Django), so the header only ever needs to
  carry a single IP, not a comma-separated chain.
- Django (`statistics.middleware.StatisticsSessionMiddleware`) reads
  `request.META['HTTP_X_FORWARDED_FOR']`, falling back to `request.META['REMOTE_ADDR']` only for
  contexts that bypass Tent entirely (e.g. Django's own test client, `manage.py runserver` hit
  directly in dev). It never merges/parses a comma-separated list — it trusts the single value
  as-is, per the point above.

## Out of scope

- Geolocation/region tracking (explicitly deferred in the issue).
- Any reporting/analytics UI or endpoint on top of the collected data — this issue is
  collection-only.
- Encrypting the cookie payload — the issue's clarifying discussion settled on Django's built-in
  signing (`django.core.signing`), not symmetric encryption.
