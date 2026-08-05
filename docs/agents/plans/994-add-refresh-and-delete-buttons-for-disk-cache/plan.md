# Plan: Add refresh and delete buttons for disk cache

Issue: [994-add-refresh-and-delete-buttons-for-disk-cache.md](../../issues/994-add-refresh-and-delete-buttons-for-disk-cache.md)

## Overview

Bring the Disk Cache dashboard card to parity with the Memory Cache card: a manual Refresh action,
and a Clear Cache action backed by a new proxy-side `DELETE /staff/cache/disk.json` endpoint that
empties the on-disk cache folder's contents (keeping the folder itself). The staff-or-superuser
auth check currently duplicated inline in `CacheSizeHandler` is extracted into a shared
`StaffAccessGuard` so the new handler reuses it instead of re-implementing it. Clear Cache also
gains a confirmation modal on **both** cards (Memory and Disk), since a stray click now has a
real filesystem side effect on the disk side, and having only one of the two cards confirm would
be inconsistent.

## Agents involved

- [proxy](proxy.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

**New proxy endpoint (proxy → frontend):**
- `DELETE /staff/cache/disk.json`
- Success: `204 No Content`, empty body.
- Auth failure: `403` with body `{"error":"Forbidden"}` (same shape `CacheSizeHandler` already
  returns) when the caller isn't logged in or isn't staff/superuser.
- Backend-call failure: whatever non-200 the backend's `/users/status.json` call returned,
  forwarded as-is (same behavior as `CacheSizeHandler`).
- The frontend must treat any non-2xx response as a failure (no JSON body is guaranteed on error
  paths other than the 403 case above) — mirror how `StaffCacheClient.clearCache()` /
  `MemoryCacheCardController.clearCache()` already just check `response.ok`.

**New translation keys (translator → frontend):**
`frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` gain a new **top-level** key
(sibling of `staff_dashboard:`, not nested inside it — neither file has any 3-level-deep key
anywhere, and the existing `delete_photo_confirm_modal:`/`slain_confirm_modal:` top-level modal
keys are the precedent to follow):
- `clear_cache_confirm_modal.title`
- `clear_cache_confirm_modal.body`
- `clear_cache_confirm_modal.cancel`
- `clear_cache_confirm_modal.confirm`

The frontend's `ClearCacheConfirmModalHelper.jsx` calls `Translator.t()` with exactly these keys
(same convention already used by `delete_photo_confirm_modal.*`) — the translator agent
must add matching entries in both language files, English and Portuguese respectively. No
interpolation/variables needed; body copy is generic (e.g. "This action cannot be undone.") since
the card's own title already gives cache-type context. All other keys this issue touches
(`clear_cache_tooltip`, `clear_cache_success`, `clear_cache_error`, `refresh_tooltip`,
`disk_cache_title`, `disk_cache_load_error`) already exist and are reused as-is — no changes
needed to them.
