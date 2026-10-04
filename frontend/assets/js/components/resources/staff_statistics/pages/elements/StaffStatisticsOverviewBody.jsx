import { useEffect, useMemo, useState } from 'react';
import OverviewController from '../controllers/OverviewController.js';
import StaffStatisticsOverviewHelper from '../helpers/StaffStatisticsOverviewHelper.jsx';
import StaffStatisticsFiltersController from './controllers/StaffStatisticsFiltersController.js';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Overview tab: loads the KPI totals and renders them inside the statistics shell.
 *
 * @description Runs {@link OverviewController} on mount (a filter change remounts the page).
 *   Granularity is irrelevant here, so the shell's filter bar hides it (the URL param is
 *   kept). The current filters are carried into the tile links.
 * @returns {React.ReactElement} The shell with the loading, error or tiles state.
 */
export default function StaffStatisticsOverviewBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filters = useMemo(() => StaffStatisticsFiltersController.currentFilters(), []);
  const controller = useMemo(() => new OverviewController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="overview" showGranularity={false}>
      {StaffStatisticsOverviewHelper.renderState({ data, loading, error }, filters)}
    </StaffStatisticsShell>
  );
}
