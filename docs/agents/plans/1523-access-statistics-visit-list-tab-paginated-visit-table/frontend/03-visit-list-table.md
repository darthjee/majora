# Visit list table

Render the table, following `StatisticsUsersTable` / `StatisticsUsersTableHelper` but without
row navigation.

- `elements/StatisticsVisitListTable.jsx({ rows, sort, filters })` delegates to
  `elements/helpers/StatisticsVisitListTableHelper.jsx`'s `render`. There are no handlers,
  because rows are not clickable.
- The helper renders a react-bootstrap `Table hover responsive`
  (`data-testid="statistics-visit-list-table"`) with these columns:
  - **User** (not sortable). For a logged-in row: `user.name` as a link to
    `#${statisticsHref('/staff/statistics', { ...filters, user: user.id })}`, the display
    name (when set) and email as `small text-muted`, and a small `visit_list.profile` link to
    `#/staff/users/<id>`. For an anonymous row: plain text `"<anonymous> · #<sessionId>"`.
  - **IP**, **Domain**: plain text.
  - **Start** (`started_at`) and **Last seen** (`last_seen`): `Intl.DateTimeFormat` with
    medium date and short time. Reuse or extract `formatLastSeen` from
    `StatisticsUsersTableHelper` rather than duplicating it. Last seen gets a Bootstrap `Badge`
    with `visit_list.ongoing` when `row.ongoing`.
  - **Duration** (`duration`): `StatisticsDurationFormatter.format`.
  - **Hits** (`hits`): `StatisticsBucketFormatter.count`.
- Sortable headers link to `#${visitListSort.sortHref(filters, key)}`. The active header gets
  `aria-sort="descending"`, a `▼` and a visually hidden `visit_list.sorted_descending`, the
  same as Users. The other headers get `aria-sort="none"`.
- Rows: `<tr key={row.id} data-testid="statistics-visit-list-row-<id>">`, with no `role`,
  `tabIndex` or click handler.

## Files to Change

- `elements/StatisticsVisitListTable.jsx` — new.
- `elements/helpers/StatisticsVisitListTableHelper.jsx` — new; exports `VISIT_LIST_COLUMNS`.
- `elements/helpers/StatisticsUsersTableHelper.jsx` — only if `formatLastSeen` moves into a
  shared helper (e.g. `helpers/StatisticsDateTimeFormatter.js`).
