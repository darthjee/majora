import { useEffect, useMemo, useState } from 'react';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import StaffUserController from './controllers/StaffUserController.js';
import StaffUserRecoveryTokensController from './controllers/StaffUserRecoveryTokensController.js';
import StaffUserHelper from './helpers/StaffUserHelper.jsx';
import RecoveryTokenActionConfirmModal from './elements/RecoveryTokenActionConfirmModal.jsx';

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
  const [actionError, setActionError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const controller = useMemo(
    () => new StaffUserController(setUser, setLoading, setError),
    [],
  );

  const tokensController = useMemo(
    () => new StaffUserRecoveryTokensController(setTokens, setTokensLoading, setTokensError, setActionError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (loading || error || !user) return undefined;
    return tokensController.buildEffect(user.id)();
  }, [tokensController, loading, error, user]);

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
      )}
      <RecoveryTokenActionConfirmModal
        show={pendingAction !== null}
        action={pendingAction?.type}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
