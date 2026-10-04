import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Duration tab page.
 *
 * @returns {React.ReactElement} The Duration tab page.
 */
export default function StaffStatisticsDuration() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="duration">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
