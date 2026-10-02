import { useEffect, useMemo, useState } from 'react';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import DeletePhotoConfirmModal from '../../../common/modals/DeletePhotoConfirmModal.jsx';
import StaffPhotosController from './controllers/StaffPhotosController.js';
import StaffPhotosHelper from './helpers/StaffPhotosHelper.jsx';

/**
 * Hook holding every piece of staff photos page state, plus the controller wired to it.
 *
 * @returns {{state: object, controller: StaffPhotosController}} Page state and controller.
 */
function useStaffPhotosState() {
  const [types, setTypes] = useState([]);
  const [maxDimension, setMaxDimension] = useState(null);
  const [photoType, setPhotoType] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [versions, setVersions] = useState({});

  const controller = useMemo(() => new StaffPhotosController({
    setTypes, setMaxDimension, setPhotoType, setPhotos, setPagination,
    setLoading, setError, setActionError, setVersions,
  }), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return {
    state: {
      types, maxDimension, photoType, photos, pagination, loading, error, actionError, versions,
    },
    controller,
  };
}

/**
 * Render the staff-only photos page (issue #1473): per-type tabs listing every photo, with
 * per-row Replace and Delete actions.
 *
 * @description `maxDimension` is loaded and kept in state but not used yet (issue #1474).
 * @returns {React.ReactElement} Staff photos page.
 */
export default function StaffPhotos() {
  const { state, controller } = useStaffPhotosState();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingReplace, setPendingReplace] = useState(null);

  if (state.loading) return StaffPhotosHelper.renderLoading();
  if (state.error) return StaffPhotosHelper.renderError(state.error);

  const handleConfirmDelete = () => {
    const photo = pendingDelete;

    setPendingDelete(null);
    return controller.handleDelete(photo);
  };

  const handleReplaceSuccess = () => {
    const photo = pendingReplace;

    setPendingReplace(null);
    return controller.handleReplaceSuccess(photo);
  };

  return (
    <>
      {StaffPhotosHelper.render(state, { onReplace: setPendingReplace, onDelete: setPendingDelete })}
      <PhotoUploadModal
        key={pendingReplace?.id ?? 'none'}
        show={pendingReplace !== null}
        uploadPath={pendingReplace ? controller.replacePath(pendingReplace) : undefined}
        onClose={() => setPendingReplace(null)}
        onSuccess={handleReplaceSuccess}
        onError={(status) => controller.handleReplaceError(pendingReplace, status)}
      />
      <DeletePhotoConfirmModal
        show={pendingDelete !== null}
        photo={pendingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
