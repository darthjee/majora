# Card controller

Add `elements/controllers/VisitsSummaryCardController.js`. Like `MemoryCacheCardController`, it
is not a `BasePageController` subclass. It owns the fetch, the clear and the in-flight state.

**Constructor:** it takes `(setSummary, setStatus, setLoading, setError)`, plus an optional
`timezone` resolver override for tests. It keeps the current `period` (default `'day'`).

**Methods:**

- `buildEffect()` — the mount effect. It fetches once, with a `mounted` flag guarding the
  setters, as `MemoryCacheCardController` does.
- `changePeriod(period)` — stores the period and fetches again.
- `refresh()` — fetches again for the current period.
- `clear()`:
  - sets status to `'loading'`;
  - calls `RequestStore.mutate({ componentName: 'VisitsSummaryCardController',
    resource: 'staffStatistics', method: 'DELETE', quantityType: 'clear', variantName: 'regular' })`;
  - on `response.ok`, parses the JSON and sets status to `{ state: 'success', deletedVisits,
    deletedSessions }` (or set the status and the counts separately, whichever reads better
    with the helper);
  - on a non-ok response or a thrown error, sets status to `'error'`;
  - **in both cases** then calls `refresh()`, because a partial clear may have happened.

**Fetch:**

- It calls `RequestStore.ensure({ componentName, resource: 'staffStatistics',
  quantityType: 'summary', query })`.
- `query` is `{ period }` plus `tz` when it resolves. The timezone comes from
  `Intl.DateTimeFormat().resolvedOptions().timeZone`, inside a `try`. A missing or empty value,
  or a thrown error, means `tz` is left out.
- On success it sets the summary to `data.unique_visitors` (a period with no data is `0`, not
  "no data"). On failure it sets `error` (403 included). In `finally` it clears `loading`.
- It sets `loading` to `true` and `error` to `false` at the start of every fetch, not only the
  first one. The card disables the select, Reload and Clear while `loading` is `true` or the
  status is `'loading'`.

`RequestStore.ensure` may dedupe or cache identical in-flight queries. Make sure Reload after a
clear really issues a new request. If `ensure` serves a cached result, use the mechanism other
callers use to force a refetch (for example `RequestStore.purge` for the `summary` quantity
type) before fetching again.

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController.js`
  — new controller.
