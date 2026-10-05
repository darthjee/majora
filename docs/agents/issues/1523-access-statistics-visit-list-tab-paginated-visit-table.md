# Issue: Access statistics: Visit list tab (paginated visit table)

## Description
Frontend of the access statistics **Visit list** tab (parent #1477). The authoritative spec is `docs/agents/specs/access-statistics/visit-list.md` (specced in #1489), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`; this issue implements its **Filters** and **Chart and layout** sections plus the frontend part of **API**. Read the spec instead of a copy here.

Dependencies are met: #1499 (frontend shell) and #1522 (`visit-list.json` endpoint) are merged. #1500 (Recharts) is not needed: the tab has no chart. The Users tab (#1520), which is also paginated and server-sorted, is the reference implementation.

## Problem
The Visit list tab (`/staff/statistics/visit-list`) still renders `StaffStatisticsPlaceholder`, although the backend endpoint is live, so staff cannot browse individual visits (user, IP, domain, start, last seen, duration, hits, ongoing).

## Expected Behavior
- The tab shows a Bootstrap table (`hover`, `responsive`) with User, IP, Domain, Start, Last seen (plus an "ongoing" badge), Duration and Hits, in API order.
- Logged-in rows: the user name links to Overview with `?user=<id>` via `statisticsHref` (other filters kept), with display name / email as secondary text and a small profile link to `#/staff/users/<id>`. Anonymous rows show "Anonymous · #<session_id>" as plain text. Rows, IPs and domains are not links; a null domain shows the translated "unknown" label.
- Formatting: Overview's duration formatter (`StatisticsDurationFormatter`), `Intl.NumberFormat` for hits and `Intl.DateTimeFormat` (browser zone) for times.
- Sortable headers (Start, Last seen, Duration, Hits) set `?sort=<key>` (omitted for the default `started_at`), reset to page 1 and mark the active column with `aria-sort="descending"`; there is no ascending toggle.
- The shared `Pagination` component (`basePath="#/staff/statistics/visit-list"`) sits under the table, and its links keep the statistics filters and `sort`.
- The filter bar hides granularity (`showGranularity={false}`). `sort` is not added to `FILTER_KEYS` and is not carried across tabs.
- States: loading (`LoadingMessage`), error (shared staff error message), empty on page 1 (a "No visits in this range" note, no table), and past the last page (the same note plus the pagination).

## Solution
Mirror the Users tab (#1520) layering instead of the spec's shorter file list:

- `pages/StaffStatisticsVisitList.jsx`: route `staffStatisticsVisitList`, wraps a body in `StaffStatisticsAccessGate` (replaces the placeholder).
- `pages/elements/StaffStatisticsVisitListBody.jsx`: state + controller effect inside `StaffStatisticsShell tab="visit_list" showGranularity={false}`.
- `pages/controllers/VisitListController.js`: RequestStore read of the `visitList` quantity type with `query: { ...StatisticsQuery.fromHash(), ...sortQuery(sort), ...getPaginationParams() }`. It maps rows to `{ id, startedAt, lastSeenAt, durationSeconds, hits, ongoing, ip, domain, sessionId, user }` (`user` = `{ id, name, displayName, email }` or `null`, `domain` = a label) and exposes `page` / `pages` / `perPage` / `sort` / `empty`.
- `pages/helpers/StaffStatisticsVisitListHelper.jsx`: loading / error / empty / past-last-page / table rendering and the pagination `extraParams` (filters minus defaults, plus `sort`).
- `pages/elements/StatisticsVisitListTable.jsx`: the table, sortable headers, user and profile links, ongoing badge.
- Sort helpers: generalize `pages/helpers/usersSort.js` into a shared helper parameterized by tab path, allowed keys and default (`currentSort`, `sortHref`, `sortQuery`), and switch the Users tab to it with no change in behavior.
- `utils/requests/config/staffStatisticsConfig.js`: `visitList` quantity type (`path: () => '/staff/statistics/visit-list.json'`, same `regular` / `private` variant, `permission: null`).
- i18n: the `staff_statistics_page.visit_list.*` keys listed in the spec, in en and pt.
- Jasmine specs for the controller (fake setters), the sort helper(s), the helper and the table.

### Out of scope
The endpoint (#1522, done), IP / session filters, ascending sort, CSV export, user agent columns and a chart (all deferred in the spec).

### Acceptance criteria
- [ ] The Visit list tab renders the spec's columns, ongoing badge, anonymous label, sortable headers, user and profile links (no row click) and pagination.
- [ ] Sort and filter changes reset to page 1; page links keep filters and `sort`; `sort` is not carried across tabs.
- [ ] The shared sort helper replaces `usersSort.js`, and the Users tab behaves exactly as before (its specs still pass).
- [ ] The controller, sort helper, page helper and table are unit-tested; the i18n keys exist in en and pt.

## Benefits
Completes the last access-statistics tab, so staff can inspect individual visits (including raw IPs and ongoing visits). The shared sort helper avoids a third copy of the per-tab sort logic.
