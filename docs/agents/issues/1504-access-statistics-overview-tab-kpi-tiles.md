# Issue: Access statistics: Overview tab (KPI tiles)

## Description

Frontend of the access statistics **Overview** tab (#1477), the landing tab at `/staff/statistics`. Spec: `docs/agents/specs/access-statistics/overview.md` (specced in #1483), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec sections named below; read them there rather than a copy here.

Dependencies are merged: #1499 (frontend shell, filter bar, RequestStore wiring) and #1503 (`GET /staff/statistics/overview.json`). The Visits tab (#1507) is the reference implementation for the page / body / controller / helper layering.

## Problem

`/staff/statistics` currently renders `StaffStatisticsPlaceholder` inside the shell. Staff landing on the statistics page see no data, even though `overview.json` is now available.

## Expected Behavior

- The landing tab shows five Bootstrap KPI cards in a responsive grid (`Row` / `Col`, `xs={12} sm={6} lg={4}`), in this order: Visits, Unique visitors, Logged-in users, Average visit duration, New vs returning (spec "Chart and layout").
- Each card links to its tab through `statisticsHref(tabPath, filters)`, so the current filters carry over (Visits → visits, Unique visitors → visitors, Logged-in users → users, Average duration → duration, New vs returning → visitors).
- Numbers use `Intl.NumberFormat` in the browser locale; the duration reads `Xm Ys` (or `Xh Ym` from one hour).
- `LoadingMessage` while loading; the shared staff-page error message on a request error.
- The granularity control is hidden on this tab only; the `granularity` URL param is left untouched, so it carries over to other tabs (spec "Filters").
- Edge cases (spec "Edge cases"): a `null` average shows `—`; the returning share is hidden when `unique_visitors == 0`; a short note under the new vs returning tile explains that "new" means "first visit recorded" (no backfill).

## Solution

Follow the Visits tab layering (#1507):

- **Page:** rename `pages/StaffStatistics.jsx` to `pages/StaffStatisticsOverview.jsx` (component `StaffStatisticsOverview`), as the spec names it, keeping the `staffStatistics` route key. Update the import and route map in `components/helpers/AppHelper.jsx` and the existing specs (`StaffStatisticsPagesSpec.js`, `AppHelperSpec/staffStatisticsRoutesSpec.js`). Swap the placeholder for a new `elements/StaffStatisticsOverviewBody.jsx`, mirroring `StaffStatisticsVisitsBody.jsx`, so the fetch only mounts after `StaffStatisticsAccessGate` lets the user through.
- **Controller:** `pages/controllers/OverviewController.js` (extends `BasePageController`, like `VisitsController`). It reads the new `overview` quantity type with `RequestStore.ensure({ resource: 'staffStatistics', quantityType: 'overview', query: StatisticsQuery.fromHash() })` and maps the `totals` (including the client-side returning share).
- **Config:** add `GET.overview` (`/staff/statistics/overview.json`, same `regular` / `private` object) to `utils/requests/config/staffStatisticsConfig.js`.
- **Tile element:** `elements/StatisticsKpiTile.jsx`, a linked Bootstrap card (label, value, optional secondary line or note).
- **Render-state helper:** `pages/helpers/StaffStatisticsOverviewHelper.jsx` for loading / error / tiles, mirroring `StaffStatisticsVisitsHelper.jsx`.
- **Duration formatter:** a pure helper in `pages/helpers/` (e.g. `StatisticsDurationFormatter.js`): `null` → `—`, under one hour → `Xm Ys`, from one hour → `Xh Ym`.
- **Granularity:** add a `showGranularity` prop (default `true`) to `StaffStatisticsFilterBar`, passed through `StaffStatisticsShell`; the Overview body passes `false`.
- **i18n:** `staff_statistics_page.overview.*` keys in both `en` and `pt`.

### Out of scope

- Charts (none on this tab).
- Previous-period comparison (deferred in the spec).
- The other tabs. Visitors, Users and Duration are still placeholders; the tiles link to them anyway, since their routes already exist.

### Acceptance criteria

- [ ] `StaffStatistics.jsx` is renamed to `StaffStatisticsOverview.jsx`, with the `staffStatistics` route still resolving to it.
- [ ] The landing tab renders the five tiles from `overview.json` with the current filters, each linking to its tab with the filters carried over.
- [ ] The granularity control is hidden on Overview only, and the `granularity` URL param is preserved.
- [ ] `null` average shows `—`; the returning share is hidden with zero visitors; the "first visit recorded" note is shown.
- [ ] Jasmine specs fully cover the controller, tile element, render helper and duration formatter (empty, `null` average, normal data, hour boundary), plus the filter bar's `showGranularity` prop.
- [ ] Translations present in both languages; lint and tests pass.

## Benefits

Staff land on a one-glance summary of site activity for the selected range, with one-click drill-down into each detailed tab.
