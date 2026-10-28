# Card component, helper and dashboard entry

**`elements/VisitsSummaryCard.jsx`:**

- The same shape as `MemoryCacheCard.jsx`: `useState` for `summary`, `status`, `loading`,
  `error`, `period` and `showConfirm`; a `useMemo` controller; and
  `useEffect(() => controller.buildEffect()(), [controller])`.
- Handlers:
  - `onPeriodChange` sets `period` and calls `controller.changePeriod(...)`;
  - `onRefresh` calls `controller.refresh()`;
  - `onClear` opens the modal.
- It renders `ClearStatisticsConfirmModal`. On confirm it closes the modal and calls
  `controller.clear()`.

**`elements/helpers/VisitsSummaryCardHelper.jsx`:**

- `render(state, handlers)` builds a `DashboardCard`.
- **`top`:** a `CardTop` with the title `staff_dashboard.visits_summary_title`. Its data slot
  shows, in order of precedence:
  - the loading text (`staff_dashboard.loading`) while loading;
  - the error text (`visits_summary_load_error`) on error;
  - otherwise the number.

  `onDataClick` can log the summary like `MemoryCacheCard`, or be a no-op.
- **Below `top`:**
  - a `<select className="form-select form-select-sm">` with an accessible label
    (`visits_period_label`) and the options `day` / `week` / `month`
    (`visits_period_day/week/month`);
  - the **link** `<a href="#/staff/statistics">` (`visits_statistics_link`).
- **`actions`:** `CardActions`.
  - Clear uses `Icons.trash` and the tooltip `visits_clear_tooltip`.
  - Reload uses `Icons.arrowClockwise` and the tooltip `refresh_tooltip`.
  - Below them, the feedback:
    - success: `visits_clear_success` with `{{visits}}` and `{{sessions}}` replaced by the counts;
    - action error: `visits_clear_error`.
- **Disabled:** the select and both actions are disabled while `loading || status === 'loading'`.

**`dashboardCardConfig.js`:** import the card and append
`{ key: 'visits_summary', Component: VisitsSummaryCard }`. Placing it last keeps the existing
cards in their current order.

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/VisitsSummaryCard.jsx`
  — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/VisitsSummaryCardHelper.jsx`
  — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js` — new
  entry.
