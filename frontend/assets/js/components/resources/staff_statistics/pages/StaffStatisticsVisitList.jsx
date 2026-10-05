import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsVisitListBody from './elements/StaffStatisticsVisitListBody.jsx';

/**
 * Access statistics Visit list tab page (issue #1523).
 *
 * @description The body (and so the visits fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Visit list tab page.
 */
export default function StaffStatisticsVisitList() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsVisitListBody />
    </StaffStatisticsAccessGate>
  );
}
