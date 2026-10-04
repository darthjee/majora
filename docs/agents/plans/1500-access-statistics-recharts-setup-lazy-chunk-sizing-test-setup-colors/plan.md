# Plan: Access statistics: Recharts setup (lazy chunk, sizing, test setup, colors)

Issue: [1500-access-statistics-recharts-setup-lazy-chunk-sizing-test-setup-colors.md](../../issues/1500-access-statistics-recharts-setup-lazy-chunk-sizing-test-setup-colors.md)

## Overview
Add Recharts 3 to the frontend, with all statistics charts in one lazy chunk loaded through a shared `StaffStatisticsCharts` wrapper (`React.lazy` + `Suspense`). Add `--majora-chart-*` CSS variables and a reusable `TimeSeriesChart` with smoke tests. The reference chart is mounted on the Visitors tab placeholder so the Vite build emits the separate chunk. Conventions: `docs/agents/specs/access-statistics/shared-infrastructure.md`, "Recharts conventions".

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- i18n key `staff_statistics_page.charts_loading` in `frontend/assets/i18n/{en,pt}/staff_statistics_page.yaml`:
  - en: `Loading charts...`
  - pt: `Carregando gráficos...`

  The frontend wrapper passes it to `LoadingMessage` as the `Suspense` fallback message.
