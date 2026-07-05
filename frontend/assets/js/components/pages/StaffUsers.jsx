import { useEffect, useMemo, useState } from 'react';
import StaffUsersController from './controllers/StaffUsersController.js';
import StaffUsersHelper from './helpers/StaffUsersHelper.jsx';

/**
 * Render staff users index page.
 *
 * @returns {React.ReactElement} Staff users page.
 */
export default function StaffUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recoveryLinks, setRecoveryLinks] = useState({});

  const controller = useMemo(
    () => new StaffUsersController(setUsers, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleGenerateRecoveryLink = (userId) => controller.handleGenerateRecoveryLink(
    userId, recoveryLinks, setRecoveryLinks,
  );

  const handleCopyRecoveryLink = (userId, url) => controller.handleCopyRecoveryLink(
    userId, url, recoveryLinks, setRecoveryLinks,
  );

  if (loading) return StaffUsersHelper.renderLoading();
  if (error) return StaffUsersHelper.renderError(error);

  return StaffUsersHelper.render(users, pagination, recoveryLinks, {
    onGenerateRecoveryLink: handleGenerateRecoveryLink,
    onCopyRecoveryLink: handleCopyRecoveryLink,
  });
}
