# Filter bar and user select

Implement the **Filter bar controls** section of `docs/agents/specs/access-statistics/shared-infrastructure.md`, plus the two decisions recorded in
the issue (resolved-granularity prop, custom user select).

- `pages/elements/StaffStatisticsFilterBar.jsx` (props: `tabPath`, `resolvedGranularity`),
  backed by `pages/elements/controllers/StaffStatisticsFiltersController.js` (plain class, no
  JSX, unit-tested with fake setters). Its state is the URL: it reads
  `StatisticsFilters.fromParams(new HashRouteResolver().getFilterParams())`, and every change
  sets `window.location.hash = statisticsHref(tabPath, nextFilters)`.
  - **Date range:** React Bootstrap `Form.Select` of the presets; `custom` shows two
    `Form.Control type="date"`. Presets apply at once; custom dates apply only when both are
    valid and `from <= to` (local state for the pending custom inputs only).
  - **Domain:** `Form.Select` fed by `RequestStore` `staffStatistics` / `domains`: "Any", every
    domain (as returned, already alphabetical; value = `id`), then "Unknown" (`unknown`).
  - **Audience:** `Form.Select` All / Anonymous / Logged-in.
  - **Granularity:** `Form.Select` Auto / Day / Week / Month. When `resolvedGranularity` is
    given, the Auto option label reads "Auto (<resolved>)", composed from
    `filters.granularities.auto` + `filters.granularities.<resolved>`. No client-side threshold
    logic.
  - **Reset:** button setting `window.location.hash = tabPath`.
- `pages/elements/StaffStatisticsUserSelect.jsx` + controller
  `pages/elements/controllers/StaffStatisticsUserSelectController.js`: a custom searchable
  select with **no new dependency** — a `Form.Control` text input, a debounced (~300 ms)
  `staffUser` / `collection` fetch with `query: { search }`, results rendered as a
  react-bootstrap `ListGroup` / dropdown showing `name` with `email` as secondary text, and a
  "no users found" row. Choosing a result calls `onChange(id)`; a clear button calls
  `onChange(null)`. When a `user` id comes from the URL, resolve its label via `staffUser` /
  `single` (`{ id }`) and show `name`; on 404 show `#<id>` with the "deleted user" hint and keep
  the filter.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsFilterBar.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsUserSelect.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/controllers/StaffStatisticsFiltersController.js` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/controllers/StaffStatisticsUserSelectController.js` — new.
