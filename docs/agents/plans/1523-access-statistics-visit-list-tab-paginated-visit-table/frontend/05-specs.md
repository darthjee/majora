# Specs

Add Jasmine specs mirroring the Users tab specs, and keep the Users specs green.

- `helpers/statisticsSortSpec.js`: the factory (`currentSort` valid / invalid / empty / missing;
  `sortHref` drops the default, adds `sort`, keeps filters, never carries `page`; `sortQuery`).
- `helpers/visitListSortSpec.js`: the keys, `started_at` default and visit-list path.
- `helpers/usersSortSpec.js`: unchanged, and must still pass.
- `controllers/VisitListControllerSpec.js`: `map` (logged-in and anonymous rows, unknown
  domain label, pagination defaults, `empty`) and `buildEffect` (query includes filters,
  non-default `sort` and pagination; error path; late response dropped), with fake setters.
- `elements/StatisticsVisitListTableSpec.js`: columns, user link to Overview with `user=<id>`,
  profile link, anonymous label with session id, unknown domain, ongoing badge, header hrefs
  and `aria-sort`, and rows without `role="link"`.
- `helpers/StaffStatisticsVisitListHelperSpec.js`: loading, error, empty page 1 (no
  pagination), past the last page (note plus pagination), and the pagination extra params.
- `elements/StaffStatisticsVisitListBodySpec.js`: renders in the shell without granularity
  and loads data (stub `RequestStore.ensure`).
- Update the existing Visit list page / placeholder spec if one asserts the placeholder.

## Files to Change

- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/statisticsSortSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/visitListSortSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/VisitListControllerSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StatisticsVisitListTableSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitListHelperSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsVisitListBodySpec.js` — new.
