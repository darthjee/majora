import { useEffect, useMemo, useState } from 'react';
import StlModelController from './controllers/StlModelController.js';
import StlModelHelper from './helpers/StlModelHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * STL model detail page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}, since `stl_models` has no per-item edit concept embedded in the
 *   payload), so the photo can be made click-to-upload for them, mirroring the PC/NPC detail
 *   pages.
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - STL model controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} STL model detail page element.
 */
export default function StlModel({ ControllerClass = StlModelController }) {
  const [stlModel, setStlModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const isStaffOrSuperUser = useStaffOrSuperUser();

  const controller = useMemo(
    () => new ControllerClass(setStlModel, setLoading, setError),
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
    // mirroring `CharacterEdit.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'stlModel' });
    controller.buildEffect()();
  };

  if (loading) return StlModelHelper.renderLoading();
  if (error) return StlModelHelper.renderError(error);

  const uploadPath = resourceConfig.get('POST', 'stlModel', 'single').regular.path({ id: stlModel.id });

  return (
    <>
      {StlModelHelper.render(stlModel, isStaffOrSuperUser, {
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
