import { useEffect, useMemo, useState } from 'react';
import VisitorsController from '../controllers/VisitorsController.js';
import StaffStatisticsVisitorsHelper from '../helpers/StaffStatisticsVisitorsHelper.jsx';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Visitors tab: loads the visitors and renders them inside the statistics shell.
 *
 * @description Runs {@link VisitorsController} on mount (a filter change remounts the page)
 *   and passes the resolved granularity to the shell's filter bar.
 * @returns {React.ReactElement} The shell with the loading, error or charts state.
 */
export default function StaffStatisticsVisitorsBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controller = useMemo(() => new VisitorsController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="visitors" resolvedGranularity={data?.granularity}>
      {StaffStatisticsVisitorsHelper.renderState({ data, loading, error })}
    </StaffStatisticsShell>
  );
}
