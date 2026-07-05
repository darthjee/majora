import { useEffect, useMemo, useState } from 'react';
import StaffUserController from './controllers/StaffUserController.js';
import StaffUserHelper from './helpers/StaffUserHelper.jsx';

/**
 * Staff user detail page.
 *
 * @returns {React.ReactElement} User detail page element.
 */
export default function StaffUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const controller = useMemo(
    () => new StaffUserController(setUser, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return StaffUserHelper.renderLoading();
  if (error) return StaffUserHelper.renderError();
  return StaffUserHelper.render(user);
}
