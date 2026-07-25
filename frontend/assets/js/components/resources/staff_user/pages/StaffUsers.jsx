import { useEffect, useMemo, useState } from 'react';
import StaffUsersController from './controllers/StaffUsersController.js';
import StaffUsersHelper from './helpers/StaffUsersHelper.jsx';
import StaffUsersFilters from './elements/StaffUsersFilters.jsx';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import buildFilteredHref from '../../../../utils/routing/buildFilteredHref.js';

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

  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const handleGenerateRecoveryLink = (userId) => controller.handleGenerateRecoveryLink(
    userId, recoveryLinks, setRecoveryLinks,
  );

  const handleCopyRecoveryLink = (userId, url) => controller.handleCopyRecoveryLink(
    userId, url, recoveryLinks, setRecoveryLinks,
  );

  const handleApprove = (userId) => controller.handleApprove(userId, users, setUsers);

  const handleDeny = (userId) => controller.handleDeny(userId, users, setUsers);

  const handleFilterQuery = (filters) => {
    window.location.hash = buildFilteredHref('#/staff/users', filters);
    controller.buildEffect()();
  };

  const handleFilterClear = () => {
    window.location.hash = '#/staff/users';
    controller.buildEffect()();
  };

  if (loading) return StaffUsersHelper.renderLoading();
  if (error) return StaffUsersHelper.renderError(error);

  return StaffUsersHelper.render(
    users,
    pagination,
    recoveryLinks,
    {
      onGenerateRecoveryLink: handleGenerateRecoveryLink,
      onCopyRecoveryLink: handleCopyRecoveryLink,
      onApprove: handleApprove,
      onDeny: handleDeny,
    },
    <StaffUsersFilters onQuery={handleFilterQuery} onClear={handleFilterClear} />,
    activeFilters,
  );
}
