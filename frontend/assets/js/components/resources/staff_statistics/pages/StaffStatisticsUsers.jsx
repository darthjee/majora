import StaffStatisticsAccessGate from './elements/StaffStatisticsAccessGate.jsx';
import StaffStatisticsUsersBody from './elements/StaffStatisticsUsersBody.jsx';

/**
 * Access statistics Users tab page (issue #1520).
 *
 * @description The body (and so the users fetch) only mounts once
 *   `StaffStatisticsAccessGate` confirmed the user is staff or superuser.
 * @returns {React.ReactElement} The Users tab page.
 */
export default function StaffStatisticsUsers() {
  return (
    <StaffStatisticsAccessGate>
      <StaffStatisticsUsersBody />
    </StaffStatisticsAccessGate>
  );
}
