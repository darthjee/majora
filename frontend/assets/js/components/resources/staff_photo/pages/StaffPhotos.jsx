import { useEffect, useMemo, useState } from 'react';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import DeletePhotoConfirmModal from '../../../common/modals/DeletePhotoConfirmModal.jsx';
import StaffPhotosController from './controllers/StaffPhotosController.js';
import StaffPhotosHelper from './helpers/StaffPhotosHelper.jsx';
import useStaffPhotoSelection from './hooks/useStaffPhotoSelection.js';

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
  const [actionInfo, setActionInfo] = useState(null);
  const [bulkJob, setBulkJob] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);

  const controller = useMemo(() => new StaffPhotosController({
    setTypes, setMaxDimension, setPhotoType, setPhotos, setPagination,
    setLoading, setError, setActionError, setVersions, setActionInfo, setBulkJob, setBulkResult,
  }), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return {
    state: {
      types, maxDimension, photoType, photos, pagination, loading, error, actionError, versions,
      actionInfo, bulkJob, bulkResult,
    },
    controller,
  };
}

/**
 * Render the staff-only photos page (issue #1473): per-type tabs listing every photo, with
 * per-row Resize, Replace and Delete actions, plus per-page selection and bulk Resize / Delete
 * (issue #1474).
 *
 * @returns {React.ReactElement} Staff photos page.
 */
export default function StaffPhotos() {
  const { state, controller } = useStaffPhotosState();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingReplace, setPendingReplace] = useState(null);
  const { selectedIds, selectedPhotos, onToggle, onToggleAll } = useStaffPhotoSelection(state.photos);

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
      {StaffPhotosHelper.render({ ...state, selectedIds }, {
        onResize: (photo) => controller.handleResize(photo),
        onReplace: setPendingReplace,
        onDelete: setPendingDelete,
        onToggle,
        onToggleAll,
        onBulk: (action) => controller.runBulk(action, selectedPhotos),
      })}
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
