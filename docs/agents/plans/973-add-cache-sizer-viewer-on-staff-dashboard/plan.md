# Plan: Add cache sizer viewer on staff dashboard

Issue: [973-add-cache-sizer-viewer-on-staff-dashboard.md](../../issues/973-add-cache-sizer-viewer-on-staff-dashboard.md)

## Overview

Adds a new "Disk Cache" card to `/#/staff/dashboard` showing the size of the proxy's own on-disk
HTTP response cache (distinct from the existing "Memory Cache" card, which shows the backend's
in-memory cache). The size is served by a brand-new proxy-only endpoint, `GET
/staff/cache/size.json`, handled by a new custom request handler (`CacheSizeHandler`) that
mirrors the existing `DeleteHandler`'s shape: it calls the backend's existing `GET
/users/status.json` to gate access to admin/staff users, then computes and returns the configured
cache folder's size in bytes. No backend (Django) code changes are needed — `/users/status.json`
already returns everything the handler needs. Alongside this, the cache folder path (currently
hardcoded as `'./cache'` in both prod and dev `rules/backend.php`) is extracted into a
`$cacheFolder` config variable, sourced from `locals.php`.

## Agents involved

- [proxy](proxy.md)
- [frontend](frontend.md)
- [translator](translator.md)

(No `backend` work: `/users/status.json` already returns everything needed, see Solution in the
issue. No `cache`/navi work: this new endpoint is proxy-handled, not a Django view, so it's not a
candidate for `navi_config.yaml` registration.)

## Shared contracts

### New proxy endpoint: `GET /staff/cache/size.json`

- **Success** — `200`, body `{"size": <bytes:int>}`. No `limit` field.
- **Not admin/staff** — `403`, when not logged in, or logged in but neither `is_staff` nor
  `is_superuser` is `true` on the `/users/status.json` response. Body content is not parsed by
  the frontend (which only checks `response.ok`), so any reasonable body is fine.
- **Upstream failure** — if the call to `GET $host/users/status.json` itself fails to cleanly
  resolve (non-`200` response, network error, timeout), the handler propagates that upstream
  `httpCode`/body as-is rather than collapsing it to `403` (same behavior as `DeleteHandler`
  forwarding a non-`200` `deletable.json` response). The frontend treats any `!response.ok` or
  thrown fetch error identically (see `frontend.md`) — it does not need to distinguish the exact
  status code.

### New translation keys (`staff_dashboard` namespace)

- `disk_cache_title` — the new card's title.
- `disk_cache_load_error` — shown when the fetch fails (any cause).
- The existing `staff_dashboard.loading` key is reused as-is for the loading state (same as
  `MemoryCacheCard` already does).

Exact copy (both `en.yaml` and `pt.yaml`) is in `translator.md`; `frontend.md` references these
key names.

### `$cacheFolder` config variable (proxy-internal only)

`proxy/prod_configuration/locals.php.sample` and the new `proxy/dev_configuration/locals.php`
both define `$cacheFolder = './cache';`. Both `rules/backend.php` files (prod and dev) and the
new `CacheSizeHandler` rule config reference this variable instead of the current hardcoded
`'./cache'` literal. This doesn't cross into `frontend`/`translator` — it's entirely within
`proxy.md`.
