import { useEffect, useMemo, useState } from 'react';
import DomainsController from '../controllers/DomainsController.js';
import StaffStatisticsDomainsHelper from '../helpers/StaffStatisticsDomainsHelper.jsx';
import StaffStatisticsFiltersController from './controllers/StaffStatisticsFiltersController.js';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Domains tab: loads the per-domain summary and renders it inside the statistics
 * shell (issue #1517).
 *
 * @description Runs {@link DomainsController} on mount (a filter change remounts the page).
 *   There is no time series here, so the shell's filter bar hides the granularity (the URL
 *   param is kept). The current filters are carried into the table row links.
 * @returns {React.ReactElement} The shell with the loading, error or domains state.
 */
export default function StaffStatisticsDomainsBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filters = useMemo(() => StaffStatisticsFiltersController.currentFilters(), []);
  const controller = useMemo(() => new DomainsController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="domains" showGranularity={false}>
      {StaffStatisticsDomainsHelper.renderState({ data, loading, error }, filters)}
    </StaffStatisticsShell>
  );
}
