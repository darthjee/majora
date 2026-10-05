import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsVisitorsBody from './elements/StaffStatisticsVisitorsBody.jsx';

/**
 * Access statistics Visitors tab page.
 *
 * @description The body (and so the visitors fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Visitors tab page.
 */
export default function StaffStatisticsVisitors() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsVisitorsBody />
    </StaffStatisticsAccessGate>
  );
}
