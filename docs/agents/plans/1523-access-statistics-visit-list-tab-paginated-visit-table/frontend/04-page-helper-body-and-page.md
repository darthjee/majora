# Page helper, body and page

Wire the tab together, following the Users tab files one for one.

- `helpers/StaffStatisticsVisitListHelper.jsx`, modeled on `StaffStatisticsUsersHelper`:
  - `renderState({ data, loading, error }, filters)`: `LoadingMessage`
    (`staff_statistics_page.charts_loading`), `ErrorAlert`, or `render`;
  - `render(data, filters)`: `<section className="mt-3" data-testid="statistics-visit-list">`
    with an `h2.h5` `visit_list.title`, then the table, or the `visit_list.empty` note
    (`data-testid="statistics-visit-list-empty"`) when `empty`, then the pagination;
  - `paginationParams(filters, sort)`: `HashQueryParams.parse(visitListSort.sortHref(filters, sort))`;
  - pagination: hidden when `empty && page <= 1`. Otherwise `Pagination` with
    `totalPages={Math.max(pages, page)}`, `basePath={StatisticsTabs.hashPath('visit_list')}`
    and the extra params above.
- `elements/StaffStatisticsVisitListBody.jsx`, modeled on `StaffStatisticsUsersBody`: state,
  `useMemo` filters (`StaffStatisticsFiltersController.currentFilters()`) and controller, and
  an effect, all inside `<StaffStatisticsShell tab="visit_list" showGranularity={false}>`.
- `StaffStatisticsVisitList.jsx`: `StaffStatisticsAccessGate` wrapping
  `StaffStatisticsVisitListBody`. Drop the placeholder imports. The route
  `staffStatisticsVisitList` already points here.
- Check that `StatisticsTabs.hashPath('visit_list')` resolves to `#/staff/statistics/visit-list`.

## Files to Change

- `helpers/StaffStatisticsVisitListHelper.jsx` — new.
- `elements/StaffStatisticsVisitListBody.jsx` — new.
- `StaffStatisticsVisitList.jsx` — replaces the placeholder.
