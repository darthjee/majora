import { useEffect, useMemo, useState } from 'react';
import StaffUserController from './controllers/StaffUserController.js';
import StaffUserRecoveryTokensController from './controllers/StaffUserRecoveryTokensController.js';
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

  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError] = useState(false);

  const controller = useMemo(
    () => new StaffUserController(setUser, setLoading, setError),
    [],
  );

  const tokensController = useMemo(
    () => new StaffUserRecoveryTokensController(setTokens, setTokensLoading, setTokensError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (loading || error || !user) return undefined;
    return tokensController.buildEffect(user.id)();
  }, [tokensController, loading, error, user]);

  if (loading) return StaffUserHelper.renderLoading();
  if (error) return StaffUserHelper.renderError();
  return StaffUserHelper.render(user, { tokens, tokensLoading, tokensError });
}
