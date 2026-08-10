import { useState } from 'react';
import StlModelsHelper from './helpers/StlModelsHelper.jsx';
import StlModelNewModal from './elements/StlModelNewModal.jsx';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Render the STL models index page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}), so `StlModelsHelper` can conditionally render the "New STL
 *   model" action. Unlike `Treasures.jsx`'s whole-page staff/superuser redirect gate,
 *   `/miniatures/stl_models` stays open to every authenticated viewer — the list itself keeps
 *   rendering regardless of this check's result. Owns the "New STL model" modal's open/closed
 *   state and a `refreshToken` counter: a successful creation closes the modal and bumps the
 *   token, which `ListPage` reads to re-fetch the list without a full page navigation.
 * @returns {React.ReactElement} STL models page.
 */
export default function StlModels() {
  const isStaffOrSuperUser = useStaffOrSuperUser();
  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSuccess = () => {
    setShowNewModal(false);
    setRefreshToken((token) => token + 1);
  };

  return (
    <>
      {StlModelsHelper.render(isStaffOrSuperUser, refreshToken, {
        onNewClick: () => setShowNewModal(true),
      })}
      <StlModelNewModal
        show={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
