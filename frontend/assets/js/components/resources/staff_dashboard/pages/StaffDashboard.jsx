import { useEffect, useMemo, useState } from 'react';
import StaffDashboardController from './controllers/StaffDashboardController.js';
import StaffDashboardHelper from './helpers/StaffDashboardHelper.jsx';

/**
 * Render staff dashboard page.
 *
 * @returns {React.ReactElement} Staff dashboard page.
 */
export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new StaffDashboardController(setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  if (loading) return StaffDashboardHelper.renderLoading();
  if (error) return StaffDashboardHelper.renderError(error);

  return StaffDashboardHelper.render();
}
