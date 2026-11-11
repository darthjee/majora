# Plan: Production: don't mark responses that set cookies as publicly cacheable

Issue: [1733-production-don-t-mark-responses-that-set-cookies-as-publicly-cacheable.md](../../issues/1733-production-don-t-mark-responses-that-set-cookies-as-publicly-cacheable.md)

## Overview

The backend's `CacheControlMiddleware` stops marking cookie-setting responses as `public`: an
anonymous successful response that carries a cookie gets `private, max-age=<anon>`. The
production `.htaccess` switches from `Header set` to `Header setifempty`, so it only fills in
`max-age=10, public` when the backend sent no `Cache-Control` (static assets) and never
overrides the backend's value. The docs record the rule and `SESSION_COOKIE_SECURE=true` as a
required production setting. Turning on `Secure` on Render and checking the edge cache are
manual steps for the owner.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)

## Shared contracts

- **Rule:** a response with `Set-Cookie` is never sent with `Cache-Control: public`.
- **Backend output** (`games.middleware.CacheControlMiddleware`, anonymous tier, including
  `/permissions/`):
  - 2xx with a cookie (`response.cookies` not empty): `Cache-Control: private, max-age=<anon>`,
    where `<anon>` is `Settings.cache_control_anonymous_max_age()` (default `3600`);
  - 2xx without a cookie: `public, max-age=<anon>` (unchanged);
  - non-2xx: `no-store` (unchanged).
  - Authenticated (`private, max-age=<auth>`), `X-Skip-Cache` (`no-store`) and Bearer
    (`no-store`) outputs are unchanged.
- **Proxy:** `Header setifempty Cache-Control "max-age=10, public" "expr=-z %{req:Authorization}"`.
  A `Cache-Control` coming from the backend through Tent always wins; responses without one
  (static files) keep `max-age=10, public`; Bearer requests never get it.
- **Tent's file cache is unaffected:** whether Tent stores a response depends on
  `skip_cache_header`/`require_cache_header` and the response code, not on `Cache-Control`
  directives, so `private` does not stop Tent caching. Cached entries already have `Set-Cookie`
  stripped and are replayed with the stored `private, max-age=<anon>`.
- **Manual (owner):** `SESSION_COOKIE_SECURE=true` in the backend's Render environment;
  confirm no edge/CDN rule caches `*.json`.
