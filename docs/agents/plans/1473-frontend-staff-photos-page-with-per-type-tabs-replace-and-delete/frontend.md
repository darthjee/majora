# Frontend Plan: Frontend: staff photos page with per-type tabs, Replace and Delete

Main plan: [plan.md](plan.md)

## Shared contracts

- Consume the i18n keys listed under "i18n keys" in [plan.md](plan.md#shared-contracts) (`staff_photos_page.*`, `staff_photos_page.types.<slug>`, `header.nav_staff_photos`). The translator agent writes the yaml; do not edit `frontend/assets/i18n/**`. Specs preload every i18n chunk via `specs/support/preloadTranslations.js`, so if the translator's files are not yet on the branch when you run specs, assert on behaviour that does not depend on the exact text, or coordinate by re-running specs once both are committed.
- API shapes and the owner-link table: see [plan.md](plan.md#shared-contracts). Note the corrected owner routes (game-scoped pages live under `/games/:slug/...`).

## Steps

- [01 — Request config and UploadClient status](frontend/01-request-config-and-upload-status.md)
- [02 — Move DeletePhotoConfirmModal to common/modals](frontend/02-move-delete-photo-confirm-modal.md)
- [03 — Routing, access and header nav](frontend/03-routing-access-header.md)
- [04 — Pure helpers (owner link, type resolution, error mapping)](frontend/04-pure-helpers.md)
- [05 — StaffPhotosController](frontend/05-controller.md)
- [06 — Page and elements](frontend/06-page-and-elements.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Respect the project's limits: 300 lines per file, complexity 10 per function. Build the owner-link builder as a type→builder map, not a switch/if chain; split the page into small elements.
- `AppHelper.render` keys the page by the full hash, so every tab or pagination link remounts the page and re-runs the effect; no extra hash listener is needed. In-mount refetches (after replace/delete/404) call the controller fetch directly.
- Never send `type` as a query param to the list endpoint; it goes in the path (`:photoType`). Use only pagination params as the query.
- `max_dimension` is read and kept in state but unused (consumed by #1474).
- Run all tooling through `docker-compose run --rm majora_fe ...`, never on the host.
