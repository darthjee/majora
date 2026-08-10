import { useEffect, useMemo, useState } from 'react';
import SourceController from './controllers/SourceController.js';
import SourceHelper from './helpers/SourceHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Source detail page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}, since `sources` has no per-item edit concept embedded in the
 *   payload), so the photo can be made click-to-upload for them, mirroring `StlModel.jsx`.
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Source controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Source detail page element.
 */
export default function Source({ ControllerClass = SourceController }) {
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const isStaffOrSuperUser = useStaffOrSuperUser();

  const controller = useMemo(
    () => new ControllerClass(setSource, setLoading, setError),
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
    // mirroring `StlModel.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'source' });
    controller.buildEffect()();
  };

  if (loading) return SourceHelper.renderLoading();
  if (error) return SourceHelper.renderError(error);

  const uploadPath = resourceConfig.get('POST', 'source', 'single').regular.path({ id: source.id });

  return (
    <>
      {SourceHelper.render(source, isStaffOrSuperUser, {
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
