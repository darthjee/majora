# Plan: Proxy: serve /photos/* with no-cache revalidation (ETag / Last-Modified)

## Overview
Make the Tent proxy force revalidation of `/photos/*` and `/files/*` so a file replaced in place
shows up on the next view. Unchanged files still cost only a cheap `304`.

## Context
- Part of #1468. Staff can replace or resize a photo in place, so its URL never changes.
- Today, the `photos.php` and `files.php` rules (dev and prod) use the `static` handler plus
  `CacheControlMiddleware` with `max-age=604800` (7 days).
- **The Tent bump is already done on `main`** (#1479): `docker-compose.yml` and
  `.circleci/config.yml` pin `darthjee/tent` / `darthjee/tent-test` at `1.0.2`. The guides under
  `docs/agents/external/tent/` were updated in the same change. This plan does not repeat that bump.
- Tent 1.0.2 ships darthjee/tent#289 as an **opt-in** `static` handler option, `conditional`
  (default `false`). On `GET` only, it adds `ETag` / `Last-Modified` to `200` responses and answers
  a matching `If-None-Match` / `If-Modified-Since` with an empty-body `304 Not Modified`. See
  `docs/agents/external/tent/request-handlers.md`.

## Steps

- [01 — `no-cache` directive in CacheControlMiddleware](plan/01-cache-control-no-cache.md)
- [02 — Switch photos/files rules to conditional + no-cache](plan/02-photos-files-rules.md)
- [03 — Refresh stale Tent version references](plan/03-stale-tent-versions.md)

## Notes
- `Cache-Control: no-cache` on `304`: Tent runs the rule's middlewares on the `304` that the
  `static` handler returns. `CacheControlMiddleware` has no status-code filter and rewrites the
  header on every response, so the `304` gets `no-cache` with no extra work. The "2xx only" default
  belongs to Tent's own response caching (`FileCacheMiddleware` matchers / `cacheCodes`); the
  photos and files rules don't use it, so it doesn't apply here. Do not add a status filter to
  `CacheControlMiddleware`.
- 404 / 403 responses, `/static/*`, the frontend and domain rules, and API JSON caching are
  unchanged.
