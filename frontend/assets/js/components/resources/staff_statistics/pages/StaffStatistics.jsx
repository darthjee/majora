import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Overview (landing) tab page.
 *
 * @returns {React.ReactElement} The Overview (landing) tab page.
 */
export default function StaffStatistics() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="overview">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
