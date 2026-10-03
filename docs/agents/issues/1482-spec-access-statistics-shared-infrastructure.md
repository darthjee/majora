# Issue: Spec: access statistics shared infrastructure

## Description

Spec-only sub-issue of #1477 (no code). Turn
`docs/agents/specs/access-statistics/shared-infrastructure.md` from `stub` into `specced` by
resolving its "To define" items, then create the shared-infrastructure implementation
sub-issue(s) under #1477. Every per-tab spec (#1483 to #1489) builds on this page.

#1481 (spec init) is done: the hub, this page (with its "Decided" section), the foundation
pages and the seven tab stubs already exist.

### Context

The page's **Decided** section already settles these points from #1477, and this issue does
not reopen them: on-the-fly aggregation over `Visit`, bucketing in Python with `zoneinfo` and
zero-filling, no rollups or server-side caching, the filter bar controls and defaults, filters
kept in the hash URL query, Recharts 3 lazy-loaded with the client / controller / helper
layering, CSS variable colors and `data-testid` smoke tests.

Facts already checked in the code:

- `HashRouteResolver` already reads query params from the hash (`HashQueryParams`), with an
  allowlist of filter keys (`HashRouteResolver.js`, around line 125). The new statistics keys
  must be added there.
- `staff/users.json` already supports `?search=` (username, display name, email; see
  `backend/staff/views/staff_users_list.py`), so the user filter can reuse it as-is.

## Problem

The shared page is still a stub. The tab specs and the implementation sub-issues need
concrete, shared answers (route and param names, API contract, aggregator interface, chart
sizing in tests, access-control docs) before they can be written. Without them, each tab
would invent its own.

## Expected Behavior

`shared-infrastructure.md` defines:

- **Navigation:** the staff menu entry, the tab shell, the routes in `HashRouteResolver.js`
  and the gates in `accessRouteConfig.js`.
- **URL query state:** the parameter names, and their addition to the `HashRouteResolver`
  filter-key allowlist.
- **Granularity:** the confirmed auto thresholds (proposed: up to 31 days → day, up to ~6
  months → ISO week, beyond → month) and the **range cap** value (chosen and justified by the spec author).
- **API conventions** for every `staff/statistics/...json` endpoint:
  - query params (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`);
  - validation (400 on invalid input; `tz` checked against
    `zoneinfo.available_timezones()`; a range over the cap);
  - the response envelope.
- **The Python aggregator:** its location (model level), interface, zero-filling, and the
  median and histogram helpers.
- **Recharts sizing in tests:** fixed size vs `ResponsiveContainer` with a stubbed
  `ResizeObserver` (Jasmine runs without layout).
- **RequestStore:** the `staffStatistics` resource config (`permission: null`, no resolver
  entry, following the `staffUser` precedent).
- **Access-control docs:** the content of `docs/agents/access-control/staff-statistics.md`
  (in the shape of `staff-cache.md`, linking the model-level `access-control/statistics.md`
  from #1478), and whether `docs/agents/permissions.yaml` needs a note under the `staff`
  scope.
- **Production topology check:** confirm nothing in front of Tent replaces `REMOTE_ADDR`, and
  that the backend port isn't directly reachable.

### Acceptance criteria

- [ ] Every "To define" item on the page is resolved, and the page's status is `specced`
      (updated in the hub too).
- [ ] Three shared implementation sub-issues are created under #1477, split by layer:
  1. **Backend:** the aggregator, the API conventions (params, validation, envelope) and
     `access-control/staff-statistics.md`.
  2. **Frontend shell:** the staff menu entry, tab shell, routes, gates, filter bar, URL
     query state and the `staffStatistics` RequestStore config.
  3. **Recharts setup:** adding `recharts`, the lazy-loaded chunk, and the chart sizing /
     `ResizeObserver` test setup.
- [ ] The created sub-issue numbers are listed in the page's "Implementation sub-issues"
      section and added to the hub's sub-issue map.
- [ ] Documentation only: no code changes.
