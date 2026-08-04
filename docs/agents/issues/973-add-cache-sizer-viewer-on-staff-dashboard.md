# Issue: Add cache sizer viewer on staff dashboard

## Description
On `/#/staff/dashboard`, add a new "Cache" card showing the current size of the proxy's on-disk
HTTP response cache (configured as `location => './cache'` in `rules/backend.php`, used by
`CacheCleanupMiddleware`/`CacheStalenessMiddleware`), formatted in a human-readable unit
(B/KB/MB/GB), following the same visual language as the existing "Memory Cache" card. This is
about the proxy's on-disk cache, distinct from the backend in-memory cache already shown by the
"Memory Cache" card — the new card must be labelled distinctly (e.g. "Disk Cache") to avoid
confusion between the two. No action buttons for now.

## Problem
Staff currently have no visibility into the proxy's on-disk cache size from the dashboard — only
the backend's in-memory cache is surfaced (via the existing "Memory Cache" card), so a growing
disk cache directory can go unnoticed. There is also no endpoint or handler on the proxy today
that gates a filesystem-level check behind an admin/staff auth check, and no shared place to
configure the cache folder path (it's hardcoded as `'./cache'` in both `rules/backend.php` files).

## Expected Behavior
- The card fetches `GET /staff/cache/size.json`, which returns `{"size": <bytes>}` (no `limit`
  field, since none applies to the disk cache).
- **Loading**: muted "Loading…" text in place of the size, while the initial fetch is in flight.
- **Success**: the size converted to the best-fit unit (B/KB/MB/GB), using the same
  conversion/formatting logic as the existing "Memory Cache" card (`UnitConverters`/
  `BytesUnitConverter`), e.g. "128 MB".
- **Any failure** (403, network error, or a propagated upstream error/status from
  `/users/status.json`): a single generic error message (`text-danger`), matching the "Memory
  Cache" card's existing pattern of collapsing all `!response.ok`/thrown cases into one generic
  "failed to load" message — no distinction made in the UI between a 403 and an upstream failure.
- **Auto-retry**: on failure, the card automatically retries the fetch every 60 seconds (no
  manual retry/refresh button, since there are no action buttons for now) until it succeeds.

## Solution

### Backend
No backend changes are needed — `GET /users/status.json` (`backend/accounts/views/auth/status.py`)
already exists and already returns `logged_in`, `is_staff`, and `is_superuser` in its payload, so
the new proxy handler can call it as-is.

### Proxy — new special request handler
- New rule file `proxy/prod_configuration/rules/cache.php` (and the dev equivalent), matching
  `GET /staff/cache/size.json` exactly, wired to a new `Tent\RequestHandlers\CacheSizeHandler`
  class (`proxy/extension/lib/handlers/CacheSizeHandler.php`), mirroring the existing
  `admin.php`/`delete.php` rule style.
- Handler built via a `build(array $params)` factory (same pattern as `UploadHandler`/
  `DeleteHandler`), taking `host` (`$backendHost`) and `cache_path` (the new `$cacheFolder`
  config value).
- Forwards the incoming `Authorization` header (via the existing `ForwardedHeaderFilter`) to call
  `GET $host/users/status.json`.
- Admin/staff check: `is_staff OR is_superuser` on a `logged_in: true` response → proceed;
  otherwise (not logged in, or neither flag set) → 403.
- If the call to `/users/status.json` itself fails (network error, backend 5xx, timeout) rather
  than cleanly resolving `logged_in`, the handler propagates that upstream error/status as-is
  rather than collapsing it to 403.
- On success, computes the size of the configured cache folder and returns `{"size": <bytes>}`.

### Proxy — `locals.php` refactor
- Prod: the real `proxy/prod_configuration/locals.php` is gitignored and managed manually in
  production — not touched by this issue. Instead add `$cacheFolder = './cache';` to
  `proxy/prod_configuration/locals.php.sample` (documenting the new variable); the reporter will
  update the real production file manually to match.
- Dev: create a new **committed** `proxy/dev_configuration/locals.php` holding only
  `$cacheFolder = './cache';`, required from `proxy/dev_configuration/configure.php` (dev
  currently has no locals-file indirection at all — `$backendHost` stays hardcoded inline in
  `rules/backend.php`).
- Update both `rules/backend.php` (prod and dev) and the new `CacheSizeHandler` to reference
  `$cacheFolder` instead of the current hardcoded `'./cache'` literals. Only the cache folder path
  is in scope for this refactor — `$backendHost` and other dev-inline values stay as they are.

### Frontend
- New "Cache" card following the same overall structure as `MemoryCacheCard`/
  `MemoryCacheCardHelper` (own client, controller, helper), registered in
  `dashboardCardConfig.js`.
- New client method fetching `GET /staff/cache/size.json`.
- Since `MetricDisplay` requires both `value` and `limit` to render its percentage bar, and this
  card has no limit, add a small new size-only display component that reuses
  `UnitConverters.forType('bytes').convert()` + `UnitConverters.formatValue()` directly, rendering
  just the converted size text (e.g. "128 MB") with no percentage/bar, placed in `CardTop`'s
  `data` slot.
- Loading/error/auto-retry behavior as described in Expected Behavior above.

## Future work (out of scope for this issue)
A follow-up issue will add a "clear cache" action button, backed by a new proxy endpoint with its
own custom request handler (same admin/staff-gated shape as `CacheSizeHandler`), with explicit
care taken to prevent path traversal when deleting files under the configured cache folder. Not
part of this issue — the size-only `CacheSizeHandler` here takes no user-supplied path input, so
no path-traversal surface exists yet.

## Benefits
- Gives staff visibility into the proxy's on-disk cache size, alongside the existing backend
  memory-cache visibility, from a single dashboard.
- Establishes a reusable pattern (admin/staff-gated proxy handler calling `/users/status.json`)
  that the future "clear cache" action can follow directly.
- Removes a hardcoded `'./cache'` path duplicated across both prod and dev `rules/backend.php`
  files, centralizing it in `locals.php`.
