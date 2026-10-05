# Domains table

Table with columns Domain, Group, Visits, Anonymous, Logged-in, Unique visitors, Avg / Median duration
(durations via `StatisticsDurationFormatter.format`). Anonymous / Logged-in columns render only when in `series`.
Clickable headers toggle sort (`sortDomains`, unknown pinned last) with an accessible indicator. Rows have
`role="link"`, `tabIndex=0`, click and Enter navigate to
`statisticsHref('/staff/statistics', { ...filters, domain: row.id })`.

- `StatisticsDomainsTable.jsx`: thin component holding `useState({ key, direction })`.
- `StatisticsDomainsTableController.js`: header toggle and row navigation, testable with fake setters.
- `StatisticsDomainsTableHelper.jsx`: react-bootstrap `Table hover responsive` rendering.

## Files to Change
- `SS/pages/elements/StatisticsDomainsTable.jsx` — new
- `SS/pages/elements/controllers/StatisticsDomainsTableController.js` — new
- `SS/pages/elements/helpers/StatisticsDomainsTableHelper.jsx` — new
- `SPEC/pages/elements/StatisticsDomainsTableSpec.js`, `SPEC/pages/elements/controllers/StatisticsDomainsTableControllerSpec.js`,
  `SPEC/pages/elements/helpers/StatisticsDomainsTableHelperSpec.js` — new
