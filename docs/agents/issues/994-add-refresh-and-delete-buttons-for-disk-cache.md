# Issue: Add refresh and delete buttons for disk cache

## Description

The Disk Cache card on `/#/staff/dashboard` shows the proxy's on-disk cache size but has no
actions — unlike the Memory Cache card next to it, which already offers Refresh and Clear Cache.
Bring the Disk Cache card to parity: add a Refresh button, and a Clear Cache button backed by a
new proxy-side endpoint that empties the cache folder's contents.

## Problem

- Staff currently have no way to clear the proxy's on-disk cache from the dashboard — only the
  in-memory cache is clearable today (`DELETE /staff/cache.json`, backend/Django). Clearing the
  disk cache requires shell access to the proxy container.
- The Disk Cache card also has no manual Refresh — its size only updates on mount, or via a silent
  60s auto-retry that only kicks in after a *failed* fetch, never on demand.

## Expected Behavior

- The Disk Cache card shows Clear Cache and Refresh actions, matching the Memory Cache card's
  layout and interaction pattern (tooltip icons, disabled state while an action is in flight,
  success/error feedback text below the card for Clear Cache).
- Clicking Refresh re-fetches the disk cache size on demand, silently updating the displayed
  value (no separate "refreshed" message), and cancels/resets any pending 60s auto-retry so the
  two mechanisms never race.
- Clicking Clear Cache (on either card) opens a confirmation modal before anything happens;
  confirming deletes every file under the proxy's cache folder (recursively for Disk Cache),
  leaving the folder itself and its directory structure intact, then shows success/error feedback
  and refreshes the displayed size. Cancelling closes the modal with no request sent.
- Only staff-or-superuser can call the new clear endpoint, same as every other `staff/*` action.

## Solution

### Clear-cache endpoint design

New dedicated endpoint: `DELETE /staff/cache/disk.json`, handled by a new proxy request handler
(working name `CacheClearHandler`), added as a second rule block in
`proxy/dev_configuration/rules/cache.php` and `proxy/prod_configuration/rules/cache.php` (same file
as the existing `CacheSizeHandler` rule, new `Configuration::buildRule` entry).

Chosen over reusing `DELETE /staff/cache/size.json` (same URI, new verb) to stay consistent with
the existing memory-cache precedent, which already splits the action endpoint from the read
endpoint (`DELETE /staff/cache.json` vs `GET /staff/cache/summary.json`). `GET
/staff/cache/size.json` is left untouched.

Behavior mirrors `CacheSizeHandler`: same staff-or-superuser gate (see "Extract shared staff/dm
auth check" below), then recursively deletes every file under the configured cache path — leaving
the folder itself and its directory structure in place — and returns `204 No Content` on success,
matching the memory-cache clear endpoint's response shape.

### Extract shared staff/dm auth check

New support class `proxy/extension/lib/support/StaffAccessGuard.php`, with a static
`requireStaffAccess(BackendClient $client, array $headers): void`, lifted from
`CacheSizeHandler::requireStaffAccess()` as-is (calls `GET /users/status.json`, throws
`BackendErrorException` forwarding a non-200 backend response as-is, throws a 403
`BackendErrorException` when the caller isn't logged in or isn't staff/superuser).

Placed as a standalone support class (composition) rather than shared base-class logic, matching
the existing pattern in `proxy/extension/lib/support/` (`BackendClient`, `CachePathSanitizer`,
`PathTraversalGuard`, `ForwardedHeaderFilter`) — the `RequestHandler` base class itself lives in
the external `darthjee/tent` framework, not this repo, so it isn't ours to extend. Both
`CacheSizeHandler` and the new `CacheClearHandler` call `StaffAccessGuard::requireStaffAccess()`
instead of each rolling their own copy.

### Refresh button behavior

`DiskCacheCardController` gains a public `refresh()` mirroring `MemoryCacheCardController.refresh()`,
with one addition to handle the auto-retry timer Memory doesn't have:

- `refresh()` cancels any pending 60s auto-retry timeout, then re-fetches the disk cache size
  immediately — a manual click never waits behind the timer, and clicking right after a failed
  auto-fetch never double-fires.
- On failure, the retry timer is rescheduled as usual — one retry mechanism total, regardless of
  whether the fetch was triggered by mount, auto-retry, or manual refresh.
- Action feedback matches Memory Cache's current behavior exactly: `refresh()` does not set an
  action `status` (silent number update, no "Refreshed" message) — only `clearCache()` does
  (loading → success/error text). Action buttons disable only while `status === 'loading'` (i.e.
  during an in-flight clear), same as Memory today.

### Confirmation before clearing

Clear Cache becomes a two-step action on **both** cards (Memory and Disk), not just Disk — Memory
Cache's clear is being retrofitted with the same guard, since a stray click has real (if
low-cost) impact there too, and having only one of the two cards confirm would be an inconsistent
UX.

- New shared component `ClearCacheConfirmModal.jsx` (+ helper), alongside the other dashboard card
  elements, following the existing `DeletePhotoConfirmModal`/`react-bootstrap` `Modal` pattern used
  elsewhere in the app. Props: `{show, onConfirm, onCancel}`. Generic body copy (e.g. "This action
  cannot be undone.") — no cache-type interpolation needed, since the card's own title already
  gives context.
- New translation keys: `staff_dashboard.clear_cache_confirm_modal.{title,body,cancel,confirm}`,
  reused by both cards.
- Both `MemoryCacheCardController` and `DiskCacheCardController` gain a `showConfirm` state:
  clicking Clear Cache opens the modal instead of firing the request immediately; confirming
  triggers the existing `clearCache()` flow; cancelling just closes the modal.

### Frontend, docs and test scope

**Frontend:**
- `StaffCacheClient` gains `clearDiskCache(token)`, mirroring `clearCache()`, calling `DELETE
  /staff/cache/disk.json`.
- `DiskCacheCardController` gains `status` state handling and a `clearCache()` method, mirroring
  `MemoryCacheCardController.clearCache()` (loading → success/error, then `refresh()` on success).
- `DiskCacheCard.jsx` gains a `status` state slot and wires `onClearCache`/`onRefresh` handlers
  through to the helper, mirroring `MemoryCacheCard.jsx`.
- `DiskCacheCardHelper.jsx` gains `CardActions` (Clear Cache + Refresh buttons) and the
  success/error feedback line below the card, mirroring `MemoryCacheCardHelper`.
- No new translation keys needed — `clear_cache_tooltip`, `clear_cache_success`,
  `clear_cache_error`, and `refresh_tooltip` (`frontend/assets/i18n/en.yaml`/`pt.yaml`) are already
  worded generically and get reused as-is.
- Icon fix (bonus, both cards): add `Icons.arrowClockwise` (`bi-arrow-clockwise`) to `Icons.js`.
  Clear Cache uses `Icons.trash` (already exists) on both cards; Refresh uses
  `Icons.arrowClockwise` on both cards — replacing Memory Cache's current duplicate use of
  `Icons.databaseFillDash` for both actions.

**Docs:** `docs/agents/access-control/staff-cache.md` is left unchanged. It documents backend
(Django) staff endpoints only; the existing `GET /staff/cache/size.json` proxy endpoint was never
added there either (self-documented instead in `CacheSizeHandler`'s own docblock), so the new
`DELETE /staff/cache/disk.json` proxy endpoint follows the same established precedent — documented
in `CacheClearHandler`'s docblock, not in `docs/agents/access-control/`.

**Tests:**
- `proxy/extension/tests/handlers/CacheClearHandlerTest.php`, mirroring
  `CacheSizeHandlerTest.php`'s auth-check coverage plus new coverage for the recursive delete
  (folder contents removed, folder itself kept, non-existent folder handled).
- `proxy/extension/tests/support/StaffAccessGuardTest.php`, covering the extracted logic
  (currently covered indirectly through `CacheSizeHandlerTest.php`).
- `frontend/specs/.../client/StaffCacheClient/clearDiskCacheSpec.js`.
- `frontend/specs/.../controllers/DiskCacheCardController/{clearCacheSpec.js,refreshSpec.js}`,
  mirroring `MemoryCacheCardController/clearCacheSpec.js` plus new coverage for the
  refresh/auto-retry-timer interaction.
- Updates to `frontend/specs/.../DiskCacheCardSpec.js` and `DiskCacheCardHelperSpec.js` for the
  new actions/feedback.
- New `ClearCacheConfirmModalSpec.js`/`ClearCacheConfirmModalHelperSpec.js`, plus updates to
  `MemoryCacheCardControllerSpec`/`MemoryCacheCardHelperSpec` for the new confirm-then-clear flow.

## Benefits

- Staff can clear a stuck/stale on-disk cache directly from the dashboard, without shell access to
  the proxy container.
- UI parity between the two cache cards removes a confusing asymmetry for staff using the
  dashboard.
- The shared `StaffAccessGuard` removes duplicated staff/dm authorization logic between proxy
  handlers, reducing the risk of the two checks drifting apart over time.
