import { useEffect, useMemo, useState } from 'react';
import VisitsController from '../controllers/VisitsController.js';
import StaffStatisticsVisitsHelper from '../helpers/StaffStatisticsVisitsHelper.jsx';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Visits tab: loads the visits and renders them inside the statistics shell.
 *
 * @description Runs {@link VisitsController} on mount (a filter change remounts the page)
 *   and passes the resolved granularity to the shell's filter bar.
 * @returns {React.ReactElement} The shell with the loading, error or chart state.
 */
export default function StaffStatisticsVisitsBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controller = useMemo(() => new VisitsController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="visits" resolvedGranularity={data?.granularity}>
      {StaffStatisticsVisitsHelper.renderState({ data, loading, error })}
    </StaffStatisticsShell>
  );
}
