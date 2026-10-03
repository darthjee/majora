import { useEffect, useMemo, useState } from 'react';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import DeletePhotoConfirmModal from '../../../common/modals/DeletePhotoConfirmModal.jsx';
import StaffPhotosController from './controllers/StaffPhotosController.js';
import StaffPhotosHelper from './helpers/StaffPhotosHelper.jsx';
import useStaffPhotoSelection from './hooks/useStaffPhotoSelection.js';
import buildStaffPhotosHandlers from './hooks/buildStaffPhotosHandlers.js';
import StaffPhotoResizeConfirmModal from './elements/StaffPhotoResizeConfirmModal.jsx';
import StaffPhotoBulkConfirmModal from './elements/StaffPhotoBulkConfirmModal.jsx';

/**
 * Hook holding every piece of staff photos page state, plus the controller wired to it.
 *
 * @returns {{state: object, controller: StaffPhotosController, dismissBulkResult: Function}}
 *   Page state, controller and the bulk result summary dismisser.
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
    dismissBulkResult: () => setBulkResult(null),
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
  const { state, controller, dismissBulkResult } = useStaffPhotosState();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingReplace, setPendingReplace] = useState(null);
  const [pendingResize, setPendingResize] = useState(null);
  const [pendingBulk, setPendingBulk] = useState(null);
  const selection = useStaffPhotoSelection(state.photos);

  if (state.loading) return StaffPhotosHelper.renderLoading();
  if (state.error) return StaffPhotosHelper.renderError(state.error);

  const { page, modals } = buildStaffPhotosHandlers({
    controller,
    selection,
    pending: {
      resize: pendingResize, bulk: pendingBulk, delete: pendingDelete, replace: pendingReplace,
    },
    setters: {
      setPendingResize, setPendingBulk, setPendingDelete, setPendingReplace, dismissBulkResult,
    },
  });

  return (
    <>
      {StaffPhotosHelper.render({ ...state, selectedIds: selection.selectedIds }, page)}
      <PhotoUploadModal
        key={pendingReplace?.id ?? 'none'}
        show={pendingReplace !== null}
        uploadPath={pendingReplace ? controller.replacePath(pendingReplace) : undefined}
        onClose={() => setPendingReplace(null)}
        onSuccess={modals.onReplaceSuccess}
        onError={modals.onReplaceError}
      />
      <DeletePhotoConfirmModal
        show={pendingDelete !== null}
        photo={pendingDelete}
        onConfirm={modals.onConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <StaffPhotoResizeConfirmModal
        photo={pendingResize}
        maxDimension={state.maxDimension}
        onConfirm={modals.onConfirmResize}
        onCancel={() => setPendingResize(null)}
      />
      <StaffPhotoBulkConfirmModal
        pending={pendingBulk}
        maxDimension={state.maxDimension}
        onConfirm={modals.onConfirmBulk}
        onCancel={() => setPendingBulk(null)}
      />
    </>
  );
}
