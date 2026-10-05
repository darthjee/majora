# Plan: Access statistics: Domains tab (domain bar chart and table)

Issue: [1517-access-statistics-domains-tab-domain-bar-chart-and-table.md](../../issues/1517-access-statistics-domains-tab-domain-bar-chart-and-table.md)

## Overview

Replace the Domains tab placeholder (`/staff/statistics/domains`) with a real page: a totals line,
a horizontal stacked Recharts bar chart of visits per domain and a sortable table whose rows
link to Overview filtered by domain. It follows the Duration (#1514) and Visitors (#1510) tab
pattern (AccessGate > Body > Shell + Helper.renderState, controller via `RequestStore.ensure`).
The backend endpoint (#1516) is not merged yet; the frontend is built against the response shape
in `docs/agents/specs/access-statistics/domains.md` ("API").

## Agents involved

- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

### API response (`GET /staff/statistics/domains/summary.json`, from the spec)

```json
{
  "filters": { "from": "...", "to": "...", "tz": "...", "granularity": "...", "requested_granularity": "...", "user": null, "domain": null, "audience": "all" },
  "domains": [
    { "id": 3, "domain": "example.com", "group": "Search", "visits": 10, "anonymous": 7, "logged_in": 3,
      "unique_visitors": 8, "average_duration_seconds": 120, "median_duration_seconds": 90 },
    { "id": "unknown", "domain": null, "group": null, "visits": 2, "anonymous": 2, "logged_in": 0,
      "unique_visitors": 2, "average_duration_seconds": null, "median_duration_seconds": null }
  ],
  "totals": { "visits": 12, "anonymous": 9, "logged_in": 3, "unique_visitors": 10,
              "average_duration_seconds": 110, "median_duration_seconds": 90 }
}
```

- `id` is an int, or `"unknown"` for the unknown row (always last). `domain` / `group` are `null` for unknown.
- Durations are int seconds or `null`. `totals` is not the sum of rows.

### i18n keys (`staff_statistics_page.domains.*`, en + pt)

`title, unknown, domain, group, visits, anonymous, logged_in, logged_in_share, unique_visitors,
average_duration, median_duration, chart, empty, load_error, total, sort_ascending, sort_descending`.
