# Shared infrastructure

> **Status:** stub · **Owner:** #1482 · Back to the [hub](../access-statistics.md)

Everything the seven tabs share: navigation, the filter bar, URL query state, granularity,
API conventions, the Python aggregator, charting and access-control docs. Performance
decisions live here, rather than on their own page, because they directly shape the
aggregator. See also the [data model](data-model.md) and
[access and security](access-and-security.md).

## Decided

Settled in #1477 (Tabs, Filters and charting, Performance & security).

### Navigation

- One route per tab under `/staff/statistics`; Overview is the landing tab
  (`/staff/statistics`).
- Routes are registered in `HashRouteResolver.js` next to `/staff/dashboard`, gated by
  `staffOrSuperuser` (see [access and security](access-and-security.md)).
- A new "Access statistics" entry in the staff menu.

### Aggregation

- **On the fly** over `Visit`, with **no precomputed rollups** until a measured need
  appears. Traffic is modest, and with indexes plus the range cap, live queries are enough.
- **Bucketing happens in Python, not in MySQL:**
  - endpoints fetch only the needed columns for the capped range (`values_list(...)`);
  - a **model-level aggregator** class (keeping views thin) converts timestamps with
    `zoneinfo` to the requested zone, groups them by day / ISO week / month, zero-fills empty
    buckets, and computes counts, unique visitors, average / **median** duration and
    histograms;
  - why: DB-side `TruncDay(..., tzinfo=…)` relies on MySQL `CONVERT_TZ`, which needs MySQL's
    time zone tables loaded in every environment (the official image doesn't load them, and
    without them it silently returns `NULL`), and MySQL has no `MEDIAN`. Python-side
    bucketing is DST-correct, DB-agnostic and easy to unit-test;
  - revisit (DB-side bucketing or rollups) only if it measures slow.
- **Time zone:** data is stored in UTC; the frontend sends the browser's IANA zone and the
  backend buckets in it.
- **Zero-filled** buckets, so charts have no gaps.
- **Bounded responses:**
  - a range cap per request;
  - the Visit list paginated per [`pagination.md`](../../pagination.md);
  - the Users ranking limited to the top N and paginated.
- **No server-side caching** at first. Responses are restricted, so the proxy doesn't cache
  them; `memory_cache` remains an option later.
- The write cost of visit tracking is handled in #1478 (throttled writes).

### Filter bar

One shared component, used by every tab:

| Filter | Control | Default |
|--------|---------|---------|
| Date range | Presets (7 days, 30 days, 90 days, 12 months) plus **Custom** with two native `<input type="date">` fields (React Bootstrap `Form.Control`, no datepicker dependency) | Last 30 days |
| User | Searchable select, reusing the staff users endpoint (`staff/users.json`) | Any |
| Domain | Select from the existing domains, plus "unknown" | Any |
| Audience | All / Anonymous / Logged-in | All |
| Granularity | Auto, with an optional override (day / week / month) | Auto |

- **Filter state lives in the URL query** of the hash route, so switching tabs keeps the
  filters, links can be shared, and Users-tab clicks just set `?user=<id>`.
- **Auto granularity** (proposal, thresholds to be confirmed): a range of 31 days or less
  uses days, up to about 6 months uses **ISO weeks** (Monday start), longer ranges use
  months.

### Charting

- **Recharts 3**, following navi's (scylla frontend) memory-usage chart
  (`MemoryUsageChartHelper.jsx` / `MemoryUsageChart.jsx` / `MemoryChartController.jsx`).
- **Lazy-loaded** via dynamic `import()` in the staff statistics route chunk, so non-staff
  users never download it. Adding `recharts` (via
  `docker-compose run --rm majora_fe yarn add`) is part of the first charting
  implementation sub-issue.
- **Three layers per chart:**
  - a client / RequestStore read, fetch only;
  - a controller: a plain class with no JSX that turns API buckets into a flat,
    ready-to-plot array, unit-tested with fake setters;
  - a helper with a pure `render(points, …)` returning the Recharts tree.
- **Data shape:** a flat array of objects, oldest first, with ready-to-plot numbers; extra
  fields (e.g. raw counts behind a percentage) are kept on each point for tooltips
  (`entry.payload`). Buckets are zero-filled, so a categorical X axis is correct.
- **Composition order:** `CartesianGrid` → axes → `Tooltip` → series (`Line` / `Bar` /
  `Area`) → markers. `isAnimationActive={false}`, and `dot={false}` on dense series.
- **Colors** are passed as CSS variables (`stroke="var(--…)"`), not class names.
- **Tests:** chart components get **smoke tests only**, asserting a `data-testid` wrapper
  renders for empty, single-point and normal data. The real logic lives in controllers and
  is fully unit-tested.
- **Dates** are formatted with `Intl.DateTimeFormat` in the browser time zone; `date-fns`
  only if it proves necessary.
- Overview KPI tiles are plain Bootstrap cards and don't need Recharts.

## To define

_To define (#1482):_

- **Navigation:**
  - the staff menu entry;
  - the tab shell;
  - routes in `HashRouteResolver.js`;
  - gates in `accessRouteConfig.js`.
- **Filter bar:**
  - controls and defaults (date presets plus custom native date inputs, user select, domain
    select including "unknown", audience, granularity override);
  - whether the staff users endpoint (`staff/users.json`) supports search, or what to add.
- **URL query state:** check whether `HashRouteResolver` supports query params, and define
  the parameter names.
- **Granularity:** the auto thresholds (proposed above) and the **range cap** value.
- **API conventions** shared by every `staff/statistics/...json` endpoint:
  - query params (`from`, `to`, `tz`, `granularity`, `user`, `domain`, `audience`);
  - validation rules (400 on invalid input; `tz` checked against
    `zoneinfo.available_timezones()`);
  - response envelope.
- **The Python aggregator design:**
  - where it lives (model level, keeping views thin);
  - its interface;
  - zero-filling;
  - median and histogram helpers.
- **Recharts conventions:**
  - fixed size vs `ResponsiveContainer` with a stubbed `ResizeObserver` (Jasmine runs
    without layout);
  - colors as CSS variables;
  - lazy-loading;
  - the client / controller / helper layering;
  - `data-testid` smoke tests.
- **RequestStore:** the `staffStatistics` resource config (`permission: null`, no resolver
  entry, following the `staffUser` precedent).
- **Access-control docs:**
  - `docs/agents/access-control/staff-statistics.md`, the authoritative per-endpoint rules
    (in the shape of `staff-cache.md`), linking the model-level `access-control/statistics.md`
    from #1478;
  - whether `docs/agents/permissions.yaml` needs a note under the `staff` scope.
- **Production topology check:** confirm nothing in front of Tent replaces `REMOTE_ADDR`, and
  that the backend port isn't directly reachable.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1482._
