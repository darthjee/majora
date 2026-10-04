# Translator Plan: Access statistics: Recharts setup (lazy chunk, sizing, test setup, colors)

Main plan: [plan.md](plan.md)

## Shared contracts

Add `staff_statistics_page.charts_loading` (en: `Loading charts...`, pt: `Carregando gráficos...`). The frontend's `StaffStatisticsCharts` wrapper uses it as the lazy-chunk loading message.

## Implementation Steps

### Step 1 — Add the charts loading string
Add `charts_loading` at the top level of the `staff_statistics_page` namespace (next to `placeholder`) in both language files, and keep the en/pt key sets in sync.

## Files to Change
- `frontend/assets/i18n/en/staff_statistics_page.yaml`: add `charts_loading: Loading charts...`
- `frontend/assets/i18n/pt/staff_statistics_page.yaml`: add `charts_loading: Carregando gráficos...`

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`, translations are preloaded by `specs/support/preloadTranslations.js`)
