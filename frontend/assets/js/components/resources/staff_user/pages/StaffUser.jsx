import { useEffect, useMemo, useState } from 'react';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import StaffUserController from './controllers/StaffUserController.js';
import StaffUserRecoveryTokensController from './controllers/StaffUserRecoveryTokensController.js';
import StaffUserApiTokensController from './controllers/StaffUserApiTokensController.js';
import StaffUserHelper from './helpers/StaffUserHelper.jsx';
import RecoveryTokenActionConfirmModal from './elements/RecoveryTokenActionConfirmModal.jsx';
import ApiTokenRevokeConfirmModal from '../../../common/api_tokens/ApiTokenRevokeConfirmModal.jsx';

/**
 * Staff user detail page.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - User controller class to instantiate, mainly for
 *   tests (mirrors `GameFaction.jsx`'s own injectable-controller pattern).
 * @returns {React.ReactElement} User detail page element.
 */
export default function StaffUser({ ControllerClass = StaffUserController }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [apiTokens, setApiTokens] = useState([]);
  const [apiTokensLoading, setApiTokensLoading] = useState(true);
  const [apiTokensError, setApiTokensError] = useState(false);
  const [apiTokensNotice, setApiTokensNotice] = useState(null);
  const [pendingApiToken, setPendingApiToken] = useState(null);

  const controller = useMemo(
    () => new ControllerClass(setUser, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const tokensController = useMemo(
    () => new StaffUserRecoveryTokensController(setTokens, setTokensLoading, setTokensError, setActionError),
    [],
  );

  const apiTokensController = useMemo(
    () => new StaffUserApiTokensController(setApiTokens, setApiTokensLoading, setApiTokensError, setApiTokensNotice),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (loading || error || !user) return undefined;
    return tokensController.buildEffect(user.id)();
  }, [tokensController, loading, error, user]);

  useEffect(() => {
    if (loading || error || !user) return undefined;
    return apiTokensController.buildEffect(user.id)();
  }, [apiTokensController, loading, error, user]);

  if (loading) return StaffUserHelper.renderLoading();
  if (error) return StaffUserHelper.renderError();

  const handleGenerateRecoveryLink = async () => {
    await RequestStore.mutate({
      componentName: 'StaffUser',
      resource: 'staffUser',
      method: 'POST',
      quantityType: 'recoveryLink',
      params: { id: user.id },
    });
    await tokensController.refresh(user.id);
  };

  const handleConfirm = async () => {
    const { type, tokenId } = pendingAction;
    setPendingAction(null);

    if (type === 'delete') {
      await tokensController.handleDelete(user.id, tokenId);
    } else {
      await tokensController.handleForceExpire(user.id, tokenId);
    }
  };

  const handleApiTokenRevokeConfirm = async () => {
    const token = pendingApiToken;
    setPendingApiToken(null);

    await apiTokensController.revoke(user.id, token?.id);
  };

  return (
    <>
      {StaffUserHelper.render(
        user,
        {
          tokens, tokensLoading, tokensError, actionError,
        },
        {
          onUnexpire: (tokenId) => tokensController.handleUnexpire(user.id, tokenId),
          onForceExpirePrompt: (tokenId) => setPendingAction({ type: 'force-expire', tokenId }),
          onDeletePrompt: (tokenId) => setPendingAction({ type: 'delete', tokenId }),
          onGenerateRecoveryLink: handleGenerateRecoveryLink,
        },
        {
          state: {
            tokens: apiTokens, loading: apiTokensLoading, error: apiTokensError, notice: apiTokensNotice,
          },
          handlers: { onRevokePrompt: setPendingApiToken },
        },
      )}
      <RecoveryTokenActionConfirmModal
        show={pendingAction !== null}
        action={pendingAction?.type}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
      <ApiTokenRevokeConfirmModal
        show={pendingApiToken !== null}
        tokenName={pendingApiToken?.name}
        ownerName={user.name}
        onConfirm={handleApiTokenRevokeConfirm}
        onCancel={() => setPendingApiToken(null)}
      />
    </>
  );
}
