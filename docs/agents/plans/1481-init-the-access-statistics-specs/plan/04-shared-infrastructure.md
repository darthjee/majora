# Shared infrastructure page

Write `docs/agents/specs/access-statistics/shared-infrastructure.md` with the reduced shape:
**Status / Owner** line (`stub`, #1482), **Decided**, **To define**, **Open questions**,
**Implementation sub-issues** (`_Created by #1482._`).

**Decided** (from #1477's Tabs, Filters and charting, and Performance & security sections):

- **Navigation:** one route per tab under `/staff/statistics` (Overview is the landing tab),
  registered in `HashRouteResolver.js` next to `/staff/dashboard`.
- **Aggregation:**
  - on the fly, with no rollups;
  - bucketing **in Python** with `zoneinfo`, in a model-level aggregator (keeping views thin).
    Why: MySQL `CONVERT_TZ` needs tz tables and silently returns `NULL` without them, and
    MySQL has no `MEDIAN`;
  - the browser's IANA time zone is sent by the frontend;
  - **zero-filled** buckets;
  - bounded responses: range cap, pagination per `docs/agents/pagination.md`, top-N
    rankings;
  - no server-side caching at first.
- **Filter bar** (one shared component):
  - date presets (7 days, 30 days, 90 days, 12 months) plus custom native
    `<input type="date">`, defaulting to 30 days;
  - a searchable user select;
  - a domain select, including "unknown";
  - audience (All / Anonymous / Logged-in);
  - granularity (auto, with an override).

  **Filter state lives in the URL query.**
- **Auto granularity** (proposal): up to 31 days → day, up to ~6 months → ISO week (Monday
  start), longer → month.
- **Recharts 3:**
  - lazy-loaded via dynamic `import()` in the staff statistics chunk;
  - three layers per chart: request/client, controller (no JSX, unit-tested), and a pure
    `render()` helper;
  - flat, ready-to-plot point arrays, with extra fields for tooltips;
  - composition order: grid → axes → tooltip → series → markers;
  - `isAnimationActive={false}`;
  - colors as CSS variables;
  - charts get smoke tests only, via a `data-testid` wrapper;
  - dates formatted with `Intl.DateTimeFormat`;
  - Overview KPI tiles are plain Bootstrap cards.

**To define:** copy the "What to define" checklist from the live body of **#1482**, verbatim
in substance. It includes the granularity thresholds, the range cap, the API conventions and
response envelope, the aggregator interface, chart sizing (fixed vs `ResponsiveContainer`),
the `staffStatistics` RequestStore config, `staff-statistics.md` / `permissions.yaml`,
`HashRouteResolver` query-param support, the staff users search, and the production topology
check.

## Files to Change

- `docs/agents/specs/access-statistics/shared-infrastructure.md`: new partly filled page.
