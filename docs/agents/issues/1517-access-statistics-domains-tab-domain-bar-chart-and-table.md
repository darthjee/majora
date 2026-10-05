# Access statistics: Domains tab (domain bar chart and table)

## Context

Frontend of the access statistics **Domains** tab (#1477), at `/staff/statistics/domains`.
Spec: `docs/agents/specs/access-statistics/domains.md` (specced in #1487), built on
`docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the
sections listed below; read them in the spec instead of a copy here.

Depends on #1499 (frontend shell, filter bar, RequestStore), #1500 (Recharts setup) and
#1516 (`domains/summary.json`).

## What needs to be done

### Frontend

- **Chart and layout** (spec "Chart and layout"):
  - A totals line (visits, anonymous / logged-in, unique visitors, average and median duration).
  - A horizontal Recharts `BarChart` (`layout="vertical"`) of visits per domain, `anonymous`
    (`--majora-chart-1`) and `logged_in` (`--majora-chart-2`) stacked, height growing with the
    row count, "unknown" at the bottom.
  - A custom tooltip (domain, group, counts, logged-in share).
  - A table under it (Domain, Group, Visits, Anonymous, Logged-in, Unique visitors,
    Avg / Median duration) with client-side sorting (unknown pinned last) and rows navigating to
    Overview with `statisticsHref('/staff/statistics', { ...filters, domain: id })`.
  - Loading, error and empty states.
- **Filters** (spec "Filters"): every shared filter; the granularity control hidden
  (`showGranularity={false}`); the series / column filtered out by `audience` hidden.
- **Page wiring**:
  - `StaffStatisticsDomains.jsx` (route `staffStatisticsDomains`) replacing the shell placeholder.
  - `DomainsController.js` reading the new `domainsSummary` quantity type
    (`/staff/statistics/domains/summary.json`) in `staffStatisticsConfig.js` with
    `StatisticsQuery.fromHash()`.
  - `elements/StatisticsDomainsTable.jsx`, `helpers/domainsSort.js`.
  - `charts/DomainsChart.jsx` (re-exported from the lazy `charts/index.js`) with
    `charts/helpers/DomainsChartHelper.jsx`, reusing Overview's duration formatter.

### Translations

- Strings in the `staff_statistics_page` i18n namespace, `domains.*` keys (en + pt), including
  the "unknown" label.

### Out of scope

A time series per domain, a `DomainGroup` rollup and previous-period comparison (deferred).

## Acceptance criteria

- [ ] The Domains tab renders the totals line, the chart and the table from `domains/summary.json` with the current filters, without the granularity control.
- [ ] Sorting keeps the unknown row last; clicking a row opens Overview filtered to that domain with the other filters kept.
- [ ] Controller, sort helper and table fully covered by Jasmine specs (empty, single row, normal data, `null` durations, unknown row); the chart component has smoke tests (empty, single-row, normal).
- [ ] Translations present in both languages.
