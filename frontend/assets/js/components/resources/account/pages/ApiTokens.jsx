import { useEffect, useMemo, useState } from 'react';
import ApiTokensController from './controllers/ApiTokensController.js';
import ApiTokensHelper from './helpers/ApiTokensHelper.jsx';

/**
 * Render the owner "API tokens" account page (issue #1605): lists the user's scoped API tokens,
 * and creates, renames and revokes them.
 *
 * @returns {React.ReactElement} API tokens page.
 */
export default function ApiTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState(false);
  const [notice, setNotice] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const controller = useMemo(
    () => new ApiTokensController({
      setTokens, setLoading, setError, setOptions, setOptionsError, setNotice,
    }),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleRenameSave = async (token) => {
    const result = await controller.rename(token, renaming?.name ?? token.name);

    setRenaming((current) => (result.ok ? null : current && { ...current, errors: result.errors }));
  };

  const handleRevokeConfirm = async () => {
    setRevoking(true);
    await controller.revoke(revokeTarget);
    setRevoking(false);
    setRevokeTarget(null);
  };

  return ApiTokensHelper.render(
    {
      tokens, loading, error, options, optionsError, notice, renaming, revokeTarget, revoking, showCreate,
    },
    {
      onRetry: () => controller.refresh(),
      onOpenCreate: () => setShowCreate(true),
      onCloseCreate: () => setShowCreate(false),
      onCreated: () => {
        setShowCreate(false);
        controller.refresh();
      },
      onRenameStart: (token) => setRenaming({ id: token.id, name: token.name, errors: {} }),
      onRenameChange: (name) => setRenaming((current) => ({ ...current, name })),
      onRenameSave: handleRenameSave,
      onRenameCancel: () => setRenaming(null),
      onRevoke: setRevokeTarget,
      onRevokeConfirm: handleRevokeConfirm,
      onRevokeCancel: () => setRevokeTarget(null),
    },
  );
}
