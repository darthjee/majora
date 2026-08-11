import { useState } from 'react';
import CollectionsHelper from './helpers/CollectionsHelper.jsx';
import CollectionNewModal from './elements/CollectionNewModal.jsx';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Render the collections index page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}), so `CollectionsHelper` can conditionally render the "New
 *   Collection" action. `/miniatures/collections` stays open to every authenticated viewer — the
 *   list itself keeps rendering regardless of this check's result. Owns the "New Collection"
 *   modal's open/closed state and a `refreshToken` counter: a successful creation closes the
 *   modal and bumps the token, which `ListPage` reads to re-fetch the list without a full page
 *   navigation.
 * @returns {React.ReactElement} Collections page.
 */
export default function Collections() {
  const isStaffOrSuperUser = useStaffOrSuperUser();
  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSuccess = () => {
    setShowNewModal(false);
    setRefreshToken((token) => token + 1);
  };

  return (
    <>
      {CollectionsHelper.render(isStaffOrSuperUser, refreshToken, {
        onNewClick: () => setShowNewModal(true),
      })}
      <CollectionNewModal
        show={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
