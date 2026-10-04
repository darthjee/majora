import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Users tab page.
 *
 * @returns {React.ReactElement} The Users tab page.
 */
export default function StaffStatisticsUsers() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="users">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
