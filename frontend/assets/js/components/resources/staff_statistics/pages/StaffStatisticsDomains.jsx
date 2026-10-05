import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsDomainsBody from './elements/StaffStatisticsDomainsBody.jsx';

/**
 * Access statistics Domains tab page (issue #1517).
 *
 * @description The body (and so the domains fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Domains tab page.
 */
export default function StaffStatisticsDomains() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsDomainsBody />
    </StaffStatisticsAccessGate>
  );
}
