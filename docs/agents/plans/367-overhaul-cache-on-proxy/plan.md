# Plan: Overhaul cache on proxy

Issue: [367-overhaul-cache-on-proxy.md](../../issues/367-overhaul-cache-on-proxy.md)

## Overview

Fix the root cause of duplicated `Cache-Control` headers on the proxy: PHP's default
`session.cache_limiter` (`nocache`, set by the base `darthjee/tent:0.9.1` image) injects
its own `Cache-Control` header whenever a session is started, colliding with whatever the
proxy's own middleware/backend sets. Disable that PHP default at the extension's bootstrap,
give `photos` and `frontend` (static) rules their own explicit `Cache-Control` staleness
middleware (currently only `backend` has one), and remove the now-unnecessary
`CollapseDuplicateHeaderMiddleware` band-aid from the `backend` rule.

## Context

Only `proxy/{dev,prod}_configuration/rules/backend.php` currently configures cache
behavior, via `Tent\Middlewares\CacheStalenessMiddleware` (`maxAgeSeconds => 10`) plus
`Tent\Middlewares\CollapseDuplicateHeaderMiddleware` (added in #350 / PR #365) to collapse
the resulting duplicate `Cache-Control` header. `photos.php` and `frontend.php` have no
cache middleware at all. The base image's `.htaccess` was ruled out as the source of the
duplicate header — the actual cause is PHP auto-injecting `Cache-Control` on
`session_start()` because `session.cache_limiter` defaults to `nocache` in the base image.
`CacheStalenessMiddleware` and `CollapseDuplicateHeaderMiddleware` are both real Tent
middlewares (the former ships with Tent 0.9.1, the latter is this project's own class at
`proxy/extension/lib/CollapseDuplicateHeaderMiddleware.php`, loaded via
`proxy/extension/loader.php`).

## Implementation Steps

### Step 1 — Disable PHP's session cache limiter at the extension bootstrap

In `proxy/extension/loader.php`, before any `require_once`, call
`session_cache_limiter('')` (equivalent to `ini_set('session.cache_limiter', '')`) so that
PHP stops auto-injecting a competing `Cache-Control` header whenever a session is started
by the framework. This must run unconditionally and early, since `loader.php` is the
extension's single entry point (mounted by Tent as `/var/www/html/extension/loader.php`).

### Step 2 — Add cache staleness middleware to the `photos` rule

In `proxy/dev_configuration/rules/photos.php` and `proxy/prod_configuration/rules/photos.php`,
add a `middlewares` entry using `Tent\Middlewares\CacheStalenessMiddleware` (mirroring the
`backend.php` usage) configured for a one-week `max-age`:
`'maxAgeSeconds' => 60 * 60 * 24 * 7` (604800). Since `photos` is a `static` handler (no
`host` upstream to revalidate against), pass whatever subset of
`CacheStalenessMiddleware`'s configuration applies to static content — check the
middleware's constructor/`build()` signature in the Tent 0.9.1 base image (not vendored in
this repo) to confirm which keys are required/optional for a `static` handler, and adjust
the config array to match (e.g. omit `host` if not applicable to static files, keep
`location` pointing at the same cache dir used elsewhere: `./cache`).

### Step 3 — Add cache staleness middleware to the `frontend` (static) rule

In `proxy/prod_configuration/rules/frontend.php` (and the static-mode branch of
`proxy/dev_configuration/rules/frontend.php`, i.e. the `else` branch used when
`FRONTEND_DEV_MODE` is not `'true'`), add the same kind of `CacheStalenessMiddleware` entry
configured for a one-day `max-age`: `'maxAgeSeconds' => 60 * 60 * 24` (86400). Apply it to
both static rules in that file (the `/assets` rule and the `/` → `index.html` rule), or
just the ones serving cacheable content — use judgment based on what `CacheStalenessMiddleware`
actually requires for `static` handlers (see Step 2's caveat). Do **not** add caching to the
dev-mode Vite-proxy branch (`FRONTEND_DEV_MODE === 'true'`) — HMR content must stay
uncached.

### Step 4 — Remove `CollapseDuplicateHeaderMiddleware` from the `backend` rule

Remove the `CollapseDuplicateHeaderMiddleware` middleware entry from the `middlewares` array
in both `proxy/dev_configuration/rules/backend.php` and
`proxy/prod_configuration/rules/backend.php`, now that Step 1 removes the actual source of
the duplicate header. Leave the `CacheCleanupMiddleware` and `CacheStalenessMiddleware`
entries untouched — `backend` should keep trusting/passing through the `max-age` set by the
backend response itself, per the issue's expected behavior.

### Step 5 — Remove the now-dead `CollapseDuplicateHeaderMiddleware` class and its test

Delete `proxy/extension/lib/CollapseDuplicateHeaderMiddleware.php` and
`proxy/extension/tests/CollapseDuplicateHeaderMiddlewareTest.php`, and remove its
`require_once` line from `proxy/extension/loader.php`. It was a band-aid introduced
specifically to collapse the duplicate `Cache-Control` header (#350 / PR #365); with the
root cause fixed in Step 1 and its only usage removed in Step 4, it is dead code.

### Step 6 — No `.htaccess` changes

Confirmed by investigation: the base image's `.htaccess` only performs URL rewriting and is
not the source of the duplicate header. Leave it untouched, per the issue.

## Files to Change

- `proxy/extension/loader.php` — add `session_cache_limiter('')` at the top; remove the
  `CollapseDuplicateHeaderMiddleware` require.
- `proxy/dev_configuration/rules/photos.php` — add `CacheStalenessMiddleware` with one-week
  `max-age`.
- `proxy/prod_configuration/rules/photos.php` — same as above.
- `proxy/dev_configuration/rules/frontend.php` — add `CacheStalenessMiddleware` with one-day
  `max-age` to the static-mode branch only.
- `proxy/prod_configuration/rules/frontend.php` — add `CacheStalenessMiddleware` with
  one-day `max-age`.
- `proxy/dev_configuration/rules/backend.php` — remove the
  `CollapseDuplicateHeaderMiddleware` entry.
- `proxy/prod_configuration/rules/backend.php` — same as above.
- `proxy/extension/lib/CollapseDuplicateHeaderMiddleware.php` — delete.
- `proxy/extension/tests/CollapseDuplicateHeaderMiddlewareTest.php` — delete.

## CI Checks

- `proxy`: `docker-compose run proxy_tests` (runs `vendor/bin/phpunit extension/tests`
  against `proxy/extension`) — no dedicated CircleCI job currently wires this in, but it is
  the project's standard local PHPUnit command for this folder and must still pass.

## Notes

- `CacheStalenessMiddleware` ships with the `darthjee/tent:0.9.1` base image and is not
  vendored into this repo, so its exact constructor/`build()` contract (which keys are
  required for a `static` handler vs. the `default_proxy` handler already used in
  `backend.php`) must be confirmed empirically (e.g. by running the dev proxy locally and
  inspecting response headers, or reading the image's PHP source inside the running
  container) before finalizing Steps 2–3's middleware config arrays.
- This is a Tent proxy rule change (`proxy/{dev,prod}_configuration/rules/*.php`), so a
  `security` review of the diff is warranted before merging, per the architect's standing
  security-review triggers.
- No backend, frontend, or infra changes are required — this is proxy-only.
