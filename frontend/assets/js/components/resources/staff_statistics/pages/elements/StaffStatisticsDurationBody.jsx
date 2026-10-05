import { useEffect, useMemo, useState } from 'react';
import DurationController from '../controllers/DurationController.js';
import StaffStatisticsDurationHelper from '../helpers/StaffStatisticsDurationHelper.jsx';
import StaffStatisticsShell from './StaffStatisticsShell.jsx';

/**
 * Body of the Duration tab: loads the visit durations and renders them inside the statistics
 * shell (issue #1514).
 *
 * @description Runs {@link DurationController} on mount (a filter change remounts the page)
 *   and passes the resolved granularity to the shell's filter bar.
 * @returns {React.ReactElement} The shell with the loading, error or charts state.
 */
export default function StaffStatisticsDurationBody() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controller = useMemo(() => new DurationController(setData, setLoading, setError), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return (
    <StaffStatisticsShell tab="duration" resolvedGranularity={data?.granularity}>
      {StaffStatisticsDurationHelper.renderState({ data, loading, error })}
    </StaffStatisticsShell>
  );
}
