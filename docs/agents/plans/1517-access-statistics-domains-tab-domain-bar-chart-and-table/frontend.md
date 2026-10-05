# Frontend Plan: Access statistics: Domains tab (domain bar chart and table)

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes `GET /staff/statistics/domains/summary.json` with the shape in [plan.md](plan.md#shared-contracts)
  (`filters`, `domains[]`, `totals`; unknown row `id: "unknown"`, always last; nullable durations).
- Uses translator keys `staff_statistics_page.domains.*` listed in [plan.md](plan.md#shared-contracts).

Paths below use `SS` = `frontend/assets/js/components/resources/staff_statistics` and
`SPEC` = `frontend/specs/assets/js/components/resources/staff_statistics`.

## Steps

- [01 — Quantity type and controller](frontend/01-quantity-type-and-controller.md)
- [02 — Sort helper](frontend/02-sort-helper.md)
- [03 — Domains chart](frontend/03-domains-chart.md)
- [04 — Domains table](frontend/04-domains-table.md)
- [05 — Page wiring](frontend/05-page-wiring.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` and `yarn check_i18n` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn build` (CI job: `upload_fe_files`)

## Notes

- Backend #1516 is not merged yet; build against the spec shape. Nothing here hits the network in specs.
- No DOM test tooling: specs use `renderToStaticMarkup`; click/sort logic lives in controllers/helpers
  testable with fake setters. Use `stubBuildEffect` / `captureConstructorFields` from `specs/support/controllerStubs.js`.
- Lint limits: 300 lines per file, complexity 10 — keep the sort comparator split into small functions.
- Keep API row order for the chart (`layout="vertical"` draws the first row at the top, so unknown ends at the bottom).
- Lazy charts render only the Suspense fallback under `renderToStaticMarkup`; test chart components by direct import.
