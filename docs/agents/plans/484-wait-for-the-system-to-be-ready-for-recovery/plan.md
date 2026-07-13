# Plan: Wait for the system to be ready for recovery

Issue: [484-wait-for-the-system-to-be-ready-for-recovery.md](../issues/484-wait-for-the-system-to-be-ready-for-recovery.md)

## Overview

Add a new, reusable backend readiness endpoint (`/ready.json`) that always bypasses caching,
and have the `RecoverPassword` page poll it every 5 seconds before rendering the recovery
form — showing a loading state, retrying on `502`/timeout, and rendering the form once any
other response is received. This is independent of the existing header health-check
(`HealthClient`/`HeaderController`), which is unaffected.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- **Endpoint**: `GET /ready.json`
  - Public, unauthenticated (`AllowAny`, no `authentication_classes`), same as `/health.json`.
  - Success response: `200` with body `{"status": "ok"}` (mirrors `/health.json`'s shape).
  - Response always sets header `X-Skip-Cache: true` (via `response['X-Skip-Cache'] = 'true'`),
    so Django's `CacheControlMiddleware` (`source/games/middleware.py`) emits
    `Cache-Control: no-store` — same generic mechanism already used by
    `source/games/views/common.py`'s `access_response`/`permissions_response`.
- **Frontend request contract**: the frontend must request `/ready.json` (note the `.json`
  suffix — Tent's proxy routing in `proxy/*/rules/backend.php` already forwards any
  `.json`-suffixed path straight to the backend) **and** send the `X-Skip-Cache: true`
  *request* header, which is what actually makes Tent's `FileCacheMiddleware` skip its file
  cache (`skip_cache_header` config in `backend.php`). This means `/ready.json` must be added
  to `frontend/assets/js/client/config/skipCacheEndpoints.js` (mirroring the existing
  `/health.json` entry) — no proxy-side (PHP) changes are needed, since `.json` routing and
  `skip_cache_header` are already configured generically.
- **Polling contract** (consumed only by frontend, produced only by the endpoint's status
  codes): a `502` response or a client-side timeout means "not ready — retry"; any other
  response (typically `200`, but per the issue also anything else such as `404`/`500`) means
  "ready — render the form." No response body fields are relied upon by the frontend beyond
  the HTTP status.
- **i18n key**: `recover_password_page.waiting_for_server` (new key under the existing
  `recover_password_page` namespace in `frontend/assets/i18n/en.yaml` and `pt.yaml`) — the
  loading message shown while polling.

## Notes

- No proxy (PHP Tent) changes required — investigated and confirmed `.json` routing plus
  `skip_cache_header` are already generically configured for the backend rule.
- No infra changes required.
