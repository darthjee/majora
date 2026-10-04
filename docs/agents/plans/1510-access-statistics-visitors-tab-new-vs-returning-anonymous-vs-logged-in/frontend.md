# Frontend Plan: Access statistics: Visitors tab (new vs returning, anonymous vs logged-in)

Main plan: [plan.md](plan.md)

## Shared contracts

Use the `staff_statistics_page.visitors.*` keys from [plan.md](plan.md#shared-contracts) (added by the translator agent): `title`, `unique_visitors`, `new`, `returning`, `returning_share`, `anonymous`, `logged_in`, `logged_in_share`, `total`, `new_returning_title`, `audience_title`, `totals_note`, `first_visit_note`, `empty`, `load_error`.

Backend contract (already merged, #1509): `GET /staff/statistics/visitors.json` returns `{ filters: { from, to, tz, granularity, requested_granularity, user, domain, audience }, buckets: [{ start, end, unique_visitors, new_visitors, returning_visitors, anonymous, logged_in }], totals: { unique_visitors, new_visitors, returning_visitors, anonymous, logged_in } }`.

## Steps

- [01 — Generalize the chart series helper](frontend/01-shared-series-helper.md)
- [02 — Make the KPI tile link optional](frontend/02-optional-kpi-tile-href.md)
- [03 — Add the visitors quantity type and controller](frontend/03-visitors-controller.md)
- [04 — Add the two Visitors charts](frontend/04-visitors-charts.md)
- [05 — Wire the Visitors tab page](frontend/05-visitors-page.md)

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`) and `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes
- Mirror the Visits tab (#1507) structure and code style (JSDoc on every class / method, static helpers with private `#` methods, pure `render` helpers).
- Coverage must stay complete: every new controller / helper branch (empty, single bucket, normal, each audience, share `null`) needs a Jasmine spec.
- Keep the Visits tab and Overview tiles behaving exactly as before; adjust their specs only where the refactors change imports or signatures.
