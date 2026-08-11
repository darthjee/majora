import { useEffect, useMemo, useState } from 'react';
import CollectionController from './controllers/CollectionController.js';
import CollectionHelper from './helpers/CollectionHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Collection detail page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}, since `collections` has no per-item edit concept embedded in
 *   the payload), so the photo can be made click-to-upload for them, mirroring `Source.jsx`.
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Collection controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Collection detail page element.
 */
export default function Collection({ ControllerClass = CollectionController }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const isStaffOrSuperUser = useStaffOrSuperUser();

  const controller = useMemo(
    () => new ControllerClass(setCollection, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // before `buildEffect()()`'s refetch, or that refetch would re-serve the pre-upload cache,
    // mirroring `Source.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'collection' });
    controller.buildEffect()();
  };

  if (loading) return CollectionHelper.renderLoading();
  if (error) return CollectionHelper.renderError(error);

  const uploadPath = resourceConfig.get('POST', 'collection', 'single').regular.path({ id: collection.id });

  return (
    <>
      {CollectionHelper.render(collection, isStaffOrSuperUser, {
        onOpenUploadModal: () => setShowUploadModal(true),
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
