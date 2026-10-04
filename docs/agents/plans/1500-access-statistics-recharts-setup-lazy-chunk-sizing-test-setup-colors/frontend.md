# Frontend Plan: Access statistics: Recharts setup (lazy chunk, sizing, test setup, colors)

Main plan: [plan.md](plan.md)

## Shared contracts

The translator adds `staff_statistics_page.charts_loading` (en/pt). Use `Translator.t('staff_statistics_page.charts_loading')` as the `LoadingMessage` message in the `Suspense` fallback.

## Steps

- [01 — Add Recharts and chart CSS variables](frontend/01-recharts-and-css-variables.md)
- [02 — Generic TimeSeriesChart and chunk entry](frontend/02-time-series-chart.md)
- [03 — Shared lazy wrapper mounted on the Visitors tab](frontend/03-lazy-wrapper.md)
- [04 — Verify the chunk split and document the test setup](frontend/04-verify-and-document.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn build` (chunk split check, not a CI job)

## Notes
- Run all commands through `docker-compose`, never `yarn`/`node` on the host.
- Under `renderToStaticMarkup`, a `React.lazy` component inside `Suspense` renders the fallback, so page specs see the loading message, not the chart. Chart smoke tests must import chart components directly.
- The Visitors mount is temporary scaffolding: #1510 replaces the placeholder and the empty-data chart with the real controller-fed charts.
