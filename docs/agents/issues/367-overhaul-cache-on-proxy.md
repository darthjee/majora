# Overhaul cache on proxy

## Context

The proxy's per-rule Cache-Control handling is inconsistent and, for the `backend` rule, ends up duplicated. Investigation showed the base `darthjee/tent` docker image's `.htaccess` carries no `Cache-Control` directive at all (just a URL rewrite rule) — the actual root cause is that PHP's `session.cache_limiter` is set to `nocache` in that image, which makes PHP auto-inject its own `Cache-Control: no-store, no-cache, must-revalidate` header whenever `session_start()` runs, regardless of Apache configuration. This collides with the `Cache-Control` set explicitly by the proxy's own middleware/backend, and today it's only patched over for the `backend` rule via `CollapseDuplicateHeaderMiddleware` (added in #350 / PR #365), which merely collapses duplicate headers instead of giving each rule the caching behavior it actually needs.

Additionally, only the `backend` rule (`proxy/prod_configuration/rules/backend.php` and its dev counterpart) has any Cache-Control handling today (a 10s staleness check plus the duplicate-header collapse band-aid). `photos.php` and `frontend.php` (static files) have no cache middleware/max-age configuration at all.

## What needs to be done

- Disable PHP's automatic session cache-limiter header at the proxy's bootstrap (e.g. `session_cache_limiter('')` / `ini_set('session.cache_limiter', '')` in `proxy/extension/loader.php`, before any session is started), so PHP stops injecting a competing `Cache-Control` header and the proxy's own middleware becomes the single source of truth.
- Add a `CacheStalenessMiddleware`-like middleware (or equivalent) to `photos.php` and `frontend.php`, mirroring the pattern already used in `backend.php`:
  - **backend**: trust and pass through the `max-age` set by the backend response itself.
  - **photos**: `max-age` of one week.
  - **static files** (frontend/assets): `max-age` of one day.
- Remove `CollapseDuplicateHeaderMiddleware` (and its registration in `proxy/extension/loader.php`) from `backend.php` in both `dev_configuration` and `prod_configuration`, since the root cause (PHP's session cache limiter) will no longer produce a duplicate header.
- No changes to `.htaccess` are expected — the base image's `.htaccess` only performs URL rewriting and was not found to be the source of the duplicate header. If the live server's file turns out to differ from the base image, that should be reconciled separately.

## Acceptance criteria

- [ ] PHP's session cache limiter no longer injects a competing `Cache-Control` header on any proxy request.
- [ ] `backend` rule passes through the backend response's own `max-age` with no duplicate `Cache-Control` header.
- [ ] `photos` rule sets `Cache-Control` with `max-age` of one week.
- [ ] `frontend`/static-file rule sets `Cache-Control` with `max-age` of one day.
- [ ] `CollapseDuplicateHeaderMiddleware` and its registration are removed from `backend.php` in both `dev_configuration` and `prod_configuration`.
- [ ] `.htaccess` is left unchanged.
