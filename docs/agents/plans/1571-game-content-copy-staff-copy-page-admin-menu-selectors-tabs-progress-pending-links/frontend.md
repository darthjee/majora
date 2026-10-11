# Frontend Plan: Game content copy: staff copy page

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the backend/proxy API listed in [plan.md](plan.md#backend-api-already-merged-consumed-by-frontend).
- Consumes the `staff_copies_page.*` and `header.nav_staff_copies` i18n keys listed in [plan.md](plan.md#i18n-keys-translator-produces-frontend-consumes). If you need a key that isn't in the table, add it to **both** `en` and `pt`.
- **Produces, for the tab issues (#1572–#1577)**: `StaffCopyRows.js`, a slug → row-component registry that ships **empty**. A tab issue registers `{ [slug]: RowComponent }`. A row component receives `{ row, selected, onToggle }` and renders the cells after the shared checkbox. The registry also exposes per-slug column headers. Document this contract in the registry's JSDoc.

## Steps

- [01 — Wiring: resource config, route, access, menu, UploadClient](frontend/01-wiring.md)
- [02 — Controller: staff gate, games, tabs, URL state, list](frontend/02-controller.md)
- [03 — Selectors, tabs, empty state, source list and row registry](frontend/03-selectors-tabs-list.md)
- [04 — Sequential copy run, progress and re-copy confirmation](frontend/04-copy-run.md)
- [05 — Pending and failed links list with retry](frontend/05-pending-links.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)
- `frontend`: Jasmine specs through the `majora_fe` service (CI job: `jasmine`)

## Notes
- Follow the existing `staff_photo` page throughout: `BasePageController` + safe setters, `RequestStore.ensure` for GETs, the mutation helper used by `StaffPhotoActions` for POSTs, `StaffPhotoBulkProgress`/`StaffPhotoBulkSummary` for progress, `StaffPhotoConfirmModal` for confirmation, and the `beforeunload` guard during a run.
- `from`/`to` are also generic filter keys (staff statistics date ranges). Read them with the hash resolver's query params on this route only. Don't change `getFilterParams()`.
- When this ships, the backend registry is empty: tabs will be empty until #1572+ land. The specs must cover a registered row (a stub registered in the spec) and the fallback row.
- Staff endpoints are `X-Skip-Cache`, so no Navi change is needed.
