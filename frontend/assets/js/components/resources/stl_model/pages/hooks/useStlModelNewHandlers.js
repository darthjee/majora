import { useState } from 'react';

/**
 * Builds StlModelNew's submit, photo-upload retry/skip and upload-modal-open handlers. Extracted
 * as a plain, non-hook function so it can be exercised directly in specs.
 *
 * @param {object} params - Builder parameters.
 * @param {object} params.controller - STL model creation controller, owning `submitForm` and
 *   `retryPhotoUpload`.
 * @param {object} params.formData - Current form values, including `sources`, `collections` and
 *   `photoFile`, as passed to `controller.submitForm`.
 * @param {(number|null)} params.createdId - Id of the already created STL model (set once the
 *   create step succeeded but the photo upload didn't), or `null`.
 * @param {File} [params.photoFile] - Photo file selected for upload, retried on demand.
 * @param {object} params.setters - State setters the controller drives.
 * @param {Function} params.setters.setStatus - Form status setter.
 * @param {Function} params.setters.setFieldErrors - Field errors setter.
 * @param {Function} params.setters.setCreatedId - Created model id setter.
 * @param {Function} params.setters.setShowUploadModal - Upload modal visibility setter.
 * @returns {{onSubmit: Function, onOpenUploadModal: Function, onRetryPhotoUpload: Function,
 *   onSkipPhotoUpload: Function}} Handlers for `StlModelNewHelper.render`.
 */
function buildHandlers({
  controller, formData, createdId, photoFile, setters,
}) {
  const {
    setStatus, setFieldErrors, setCreatedId, setShowUploadModal,
  } = setters;

  return {
    onSubmit: (event) => controller.submitForm(
      event,
      formData,
      { setStatus, setFieldErrors, setCreatedId },
    ),
    onOpenUploadModal: () => setShowUploadModal(true),
    onRetryPhotoUpload: () => controller.retryPhotoUpload(
      createdId,
      photoFile,
      { setStatus, setCreatedId },
    ),
    onSkipPhotoUpload: () => {
      if (typeof window !== 'undefined') {
        window.location.hash = `/miniatures/stl_models/${createdId}`;
      }
    },
  };
}

/**
 * Owns StlModelNew's created-model id and upload modal visibility state, and builds the
 * handlers relying on them.
 *
 * @param {object} params - Hook parameters.
 * @param {object} params.controller - STL model creation controller.
 * @param {object} params.formData - Current form values (fields plus `sources`, `collections`
 *   and `photoFile`), submitted as-is.
 * @param {File} [params.photoFile] - Photo file selected for upload.
 * @param {Function} params.setStatus - Form status setter.
 * @param {Function} params.setFieldErrors - Field errors setter.
 * @returns {{handlers: object, modalProps: {showUploadModal: boolean, onClose: Function}}}
 *   `handlers` for `StlModelNewHelper.render`, and `modalProps` to spread into
 *   `StlModelNewModals`.
 */
export default function useStlModelNewHandlers({
  controller, formData, photoFile, setStatus, setFieldErrors,
}) {
  const [createdId, setCreatedId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  return {
    handlers: buildHandlers({
      controller,
      formData,
      createdId,
      photoFile,
      setters: {
        setStatus, setFieldErrors, setCreatedId, setShowUploadModal,
      },
    }),
    modalProps: { showUploadModal, onClose: () => setShowUploadModal(false) },
  };
}

export { buildHandlers };
