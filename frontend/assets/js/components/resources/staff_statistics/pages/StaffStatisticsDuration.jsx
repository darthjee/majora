import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsDurationBody from './elements/StaffStatisticsDurationBody.jsx';

/**
 * Access statistics Duration tab page.
 *
 * @description The body (and so the duration fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Duration tab page.
 */
export default function StaffStatisticsDuration() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsDurationBody />
    </StaffStatisticsAccessGate>
  );
}
