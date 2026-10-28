# Frontend Plan: Statistics dashboard: visits summary card on the staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

- Use only the i18n keys listed in the main plan's [Shared contracts](plan.md#shared-contracts):
  `staff_dashboard.visits_*`, `staff_dashboard.refresh_tooltip`, and
  `clear_statistics_confirm_modal.*`. The translator agent adds them.
- Endpoints (already merged):
  - `GET /staff/statistics/summary.json?period=<day|week|month>&tz=<IANA>` →
    `200 {"period", "from", "to", "tz", "unique_visitors"}`. Returns `400` for an invalid
    `period`/`tz`, `401`/`403` for non-staff callers.
  - `DELETE /staff/statistics.json` → `200 {"deleted_visits", "deleted_sessions"}`, or
    `401`/`403`/`500`.

## Context

- The card follows `MemoryCacheCard` (`elements/MemoryCacheCard.jsx`, its controller and helper,
  and `ClearCacheConfirmModal`). There is one difference: the requests go through `RequestStore`
  instead of a dedicated client.
- `RequestStore.ensure({ componentName, resource, quantityType, query })` resolves
  `{ data }`, as in `staff_statistics/pages/controllers/OverviewController.js`.
- `RequestStore.mutate({ componentName, resource, method: 'DELETE', quantityType, variantName })`
  resolves the raw `Response` (callers check `response.ok` and call `response.json()`), as in
  `staff_photo/pages/controllers/StaffPhotoActions.js`.
- All paths below are relative to
  `frontend/assets/js/components/resources/staff_dashboard/pages/` unless stated otherwise.
  Specs mirror them under `frontend/specs/assets/js/...`.

## Steps

- [01 — Request config entries](frontend/01-request-config.md)
- [02 — Card controller](frontend/02-card-controller.md)
- [03 — Typed-confirmation modal](frontend/03-confirm-modal.md)
- [04 — Card component, helper and dashboard entry](frontend/04-card-component.md)
- [05 — Jasmine specs](frontend/05-specs.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Until the translator's keys land, `Translator.t` falls back to the key itself. Specs that
  assert on text should look the text up through `Translator.t(...)` and not hard-code it.
- The end-to-end check (the issue's last acceptance criterion) runs against the full stack
  (`docker-compose up`), logged in as staff. Check the count for each period, Reload, a clear
  (the success status shows the counts, and the count drops to the post-clear value), and a
  failing clear (for example a non-staff session, which shows the error state).
