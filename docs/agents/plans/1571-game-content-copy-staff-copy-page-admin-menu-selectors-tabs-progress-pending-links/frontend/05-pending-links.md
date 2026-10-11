# Pending and failed links list with retry

- `StaffCopyLinks` (below the tabs, independent of the active tab, shown whenever `to` is set, **including the empty-types state**): `GET links` with `?to=<slug>`. Rows show `entity.name` (plus the type label if available), `link_kind.<upload_type>`, `link_status.<status>`, and `link_error.<error>` for failures (unknown codes → `link_error.unknown`). Empty → `links_empty`.
- Retry (any row, one at a time per row, disabled while that row is retrying): `POST renew` → on success `linkUpload(upload_type, upload_id, token)` with the new token. On link success, drop the row. On renew or link `404`, drop the row. On renew `409`, show `link_error.in_flight`. On a link failure, refetch the list so the backend `error` shows.
- Not paginated (the endpoint returns a plain array).
- Specs: render of each status/error, retry success, `404` drop on renew and on link, `409`, link failure refetch, hidden without `to`.

## Files to Change
- `.../staff_copy/pages/elements/StaffCopyLinks.jsx` — new.
- `.../staff_copy/pages/controllers/StaffCopyLinksController.js` (or methods on `StaffCopyActions` plus a small hook, whichever fits the existing patterns) — new.
- Matching specs.
