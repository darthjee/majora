import { useEffect, useMemo, useState } from 'react';
import VisitListController from '../controllers/VisitListController.js';
import StaffStatisticsVisitListHelper from '../helpers/StaffStatisticsVisitListHelper.jsx';
import StaffStatisticsFiltersController from './controllers/StaffStatisticsFiltersController.js';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Visit list tab: loads the paginated visits and renders them inside the
 * statistics shell (issue #1523).
 *
 * @description Runs {@link VisitListController} on mount. A filter, sort or page change is a
 *   hash change, which remounts the page (the app keys the page by hash), so it refetches.
 *   There is no time series here, so the shell's filter bar hides the granularity (the URL
 *   param is kept). The current filters are carried into the table and pagination links.
 * @returns {React.ReactElement} The shell with the loading, error or visit list state.
 */
export default function StaffStatisticsVisitListBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filters = useMemo(() => StaffStatisticsFiltersController.currentFilters(), []);
  const controller = useMemo(() => new VisitListController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="visit_list" showGranularity={false}>
      {StaffStatisticsVisitListHelper.renderState({ data, loading, error }, filters)}
    </StaffStatisticsShell>
  );
}
