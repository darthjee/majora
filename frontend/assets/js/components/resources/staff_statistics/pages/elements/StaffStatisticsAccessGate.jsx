import { useEffect, useMemo, useState } from 'react';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import StaffStatisticsPageController from '../controllers/StaffStatisticsPageController.js';

/**
 * Renders its children only once the user is confirmed as staff or superuser.
 *
 * @description Runs {@link StaffStatisticsPageController}, which redirects everyone else to
 *   the home page. Starts from the cached access check (`AccessStore.isStaffOrSuperUser()`), so a
 *   known staff user sees the page at once; otherwise renders nothing while the check is
 *   pending.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Page content.
 * @returns {React.ReactElement|null} The children, or `null` until access is confirmed.
 */
export default function StaffStatisticsAccessGate({ children }) {
  const [allowed, setAllowed] = useState(() => AccessStore.isStaffOrSuperUser());
  const controller = useMemo(() => new StaffStatisticsPageController(setAllowed), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  if (!allowed) return null;

  return children;
}
