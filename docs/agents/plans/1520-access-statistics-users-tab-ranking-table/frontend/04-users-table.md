# Add the StatisticsUsersTable

Model it on `StatisticsDomainsTable.jsx` with its `elements/controllers/` and
`elements/helpers/` split, but with URL-driven sorting.

- `StatisticsUsersTable({ rows, sort, filters })` renders a Bootstrap `Table` (`hover`,
  `responsive`) with the spec's columns: User, Visits, Time on site, Avg duration, Hits,
  Domains and Last seen.
- **User cell**: `name`, then `displayName` (when set) and `email` as small secondary text,
  plus a small `#/staff/users/<id>` link labelled `users.profile`. The link's `onClick` calls
  `event.stopPropagation()`.
- **Formatting**: `Intl.NumberFormat` for counts, `StatisticsDurationFormatter.format` for
  both durations, `Intl.DateTimeFormat` (date and time, browser zone) for `lastSeenAt`, and
  domain labels joined with `, `.
- **Headers**: sortable headers are `<a href={sortHref(filters, key)}>`. The active one has
  `aria-sort="descending"` and a visually-hidden `users.sorted_descending` indicator.
- **Rows**: `role="link"`, `tabIndex={0}`. Click, Enter or Space sets `window.location.hash =
  statisticsHref('/staff/statistics', { ...filters, user: row.id })`, via a
  `StatisticsUsersTableController` (`openRow`, `handleRowKeyDown`) like the Domains one.
- Jasmine specs for the controller, the helper and the component: columns, formatting,
  active header, href per header, row click / keyboard navigation, and the profile link not
  triggering the row navigation.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StatisticsUsersTable.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/controllers/StatisticsUsersTableController.js` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsUsersTableHelper.jsx` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StatisticsUsersTableSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/controllers/StatisticsUsersTableControllerSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsUsersTableHelperSpec.js` — new.
