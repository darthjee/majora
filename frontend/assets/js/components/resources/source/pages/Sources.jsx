import { useState } from 'react';
import SourcesHelper from './helpers/SourcesHelper.jsx';
import SourceNewModal from './elements/SourceNewModal.jsx';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Render the sources index page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}), so `SourcesHelper` can conditionally render the "New Source"
 *   action. `/miniatures/sources` stays open to every authenticated viewer — the list itself keeps
 *   rendering regardless of this check's result. Owns the "New Source" modal's open/closed state
 *   and a `refreshToken` counter: a successful creation closes the modal and bumps the token, which
 *   `ListPage` reads to re-fetch the list without a full page navigation.
 * @returns {React.ReactElement} Sources page.
 */
export default function Sources() {
  const isStaffOrSuperUser = useStaffOrSuperUser();
  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSuccess = () => {
    setShowNewModal(false);
    setRefreshToken((token) => token + 1);
  };

  return (
    <>
      {SourcesHelper.render(isStaffOrSuperUser, refreshToken, {
        onNewClick: () => setShowNewModal(true),
      })}
      <SourceNewModal
        show={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
