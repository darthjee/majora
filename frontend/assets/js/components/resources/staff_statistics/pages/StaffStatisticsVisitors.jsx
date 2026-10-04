import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Visitors tab page.
 *
 * @returns {React.ReactElement} The Visitors tab page.
 */
export default function StaffStatisticsVisitors() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="visitors">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
