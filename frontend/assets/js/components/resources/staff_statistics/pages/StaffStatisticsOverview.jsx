import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsOverviewBody from './elements/StaffStatisticsOverviewBody.jsx';

/**
 * Access statistics Overview (landing) tab page.
 *
 * @description The body (and so the overview fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Overview (landing) tab page.
 */
export default function StaffStatisticsOverview() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsOverviewBody />
    </StaffStatisticsAccessGate>
  );
}
