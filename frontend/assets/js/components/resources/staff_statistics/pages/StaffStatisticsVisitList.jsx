import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsPlaceholder from './elements/StaffStatisticsPlaceholder.jsx';
import StaffStatisticsShell from './elements/StaffStatisticsShell.jsx';

/**
 * Access statistics Visit list tab page.
 *
 * @returns {React.ReactElement} The Visit list tab page.
 */
export default function StaffStatisticsVisitList() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsShell tab="visit_list">
        <StaffStatisticsPlaceholder />
      </StaffStatisticsShell>
    </StaffStatisticsAccessGate>
  );
}
