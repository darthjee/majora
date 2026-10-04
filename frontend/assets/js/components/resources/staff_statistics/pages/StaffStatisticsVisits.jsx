import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Visits tab page.
 *
 * @returns {React.ReactElement} The Visits tab page.
 */
export default function StaffStatisticsVisits() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="visits">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
