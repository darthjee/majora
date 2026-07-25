import { useEffect, useMemo, useState } from 'react';
import AuthorizationRequestsController from './controllers/AuthorizationRequestsController.js';
import AuthorizationRequestsHelper from './helpers/AuthorizationRequestsHelper.jsx';

/**
 * Render the authorization requests account page: a paginated table of the
 * authenticated user's own device-authorization requests, with deny/authorize
 * confirm modals for any still-`open` row.
 *
 * @returns {React.ReactElement} Authorization requests page.
 */
export default function AuthorizationRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [denyTarget, setDenyTarget] = useState(null);
  const [authorizeTarget, setAuthorizeTarget] = useState(null);
  const [password, setPassword] = useState('');
  const [authorizeError, setAuthorizeError] = useState(false);

  const controller = useMemo(
    () => new AuthorizationRequestsController(setRequests, setPagination, setLoading),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const closeModals = () => {
    setDenyTarget(null);
    setAuthorizeTarget(null);
    setPassword('');
    setAuthorizeError(false);
  };

  const handleOpenAuthorize = (request) => {
    setPassword('');
    setAuthorizeError(false);
    setAuthorizeTarget(request);
  };

  const handleDenyConfirm = async () => {
    if (!denyTarget) {
      return;
    }

    await controller.handleDeny(denyTarget.uuid);
    closeModals();
  };

  const handleAuthorizeConfirm = async () => {
    if (!authorizeTarget) {
      return;
    }

    const result = await controller.handleAuthorize(authorizeTarget.uuid, password);

    if (result.ok) {
      closeModals();
      return;
    }

    setAuthorizeError(true);
  };

  if (loading) return AuthorizationRequestsHelper.renderLoading();

  return AuthorizationRequestsHelper.render(
    requests,
    pagination,
    {
      denyTarget, authorizeTarget, password, authorizeError,
    },
    {
      onOpenDeny: setDenyTarget,
      onOpenAuthorize: handleOpenAuthorize,
      onCloseModals: closeModals,
      onDenyConfirm: handleDenyConfirm,
      onAuthorizeConfirm: handleAuthorizeConfirm,
      onPasswordChange: (event) => setPassword(event.target.value),
    },
  );
}
