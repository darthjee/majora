import { useEffect, useMemo, useState } from 'react';
import UsersController from '../controllers/UsersController.js';
import StaffStatisticsUsersHelper from '../helpers/StaffStatisticsUsersHelper.jsx';
import StaffStatisticsFiltersController from './controllers/StaffStatisticsFiltersController.js';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Users tab: loads the users ranking and renders it inside the statistics shell
 * (issue #1520).
 *
 * @description Runs {@link UsersController} on mount. A filter, sort or page change is a
 *   hash change, which remounts the page (the app keys the page by hash), so it refetches.
 *   There is no time series here, so the shell's filter bar hides the granularity (the URL
 *   param is kept). The current filters are carried into the table and pagination links.
 * @returns {React.ReactElement} The shell with the loading, error or users state.
 */
export default function StaffStatisticsUsersBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filters = useMemo(() => StaffStatisticsFiltersController.currentFilters(), []);
  const controller = useMemo(() => new UsersController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="users" showGranularity={false}>
      {StaffStatisticsUsersHelper.renderState({ data, loading, error }, filters)}
    </StaffStatisticsShell>
  );
}
