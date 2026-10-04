import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Domains tab page.
 *
 * @returns {React.ReactElement} The Domains tab page.
 */
export default function StaffStatisticsDomains() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="domains">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
