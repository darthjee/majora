import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsVisitsBody from './elements/StaffStatisticsVisitsBody.jsx';

/**
 * Access statistics Visits tab page.
 *
 * @description The body (and so the visits fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Visits tab page.
 */
export default function StaffStatisticsVisits() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsVisitsBody />
    </StaffStatisticsAccessGate>
  );
}
