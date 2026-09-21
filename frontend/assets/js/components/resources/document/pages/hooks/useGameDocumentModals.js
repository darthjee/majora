import { useState } from 'react';
import RequestStore from '../../../../../utils/requests/RequestStore.js';

/**
 * Builds an upload-success handler for a given modal setter.
 *
 * @description Purges before refetching: the upload saga doesn't go through
 *   `RequestStore.mutate` (it's a two-step, non-JSON-body saga), so the cache purge must
 *   happen explicitly here, mirroring `GameItem.jsx`'s own `handleUploadSuccess`. Shared by
 *   both the photo and file upload modals (issue #726).
 * @param {object} controller - Document controller, whose `buildEffect()()` reloads the document.
 * @param {Function} setShow - State setter for the modal's visibility.
 * @returns {Function} Success handler to pass as the modal's `onSuccess` prop.
 */
function buildUploadSuccessHandler(controller, setShow) {
  return () => {
    setShow(false);
    RequestStore.purge({ resource: 'document' });
    controller.buildEffect()();
  };
}

/**
 * Builds the click handlers and modal-props builder driving GameDocument's three modals. Extracted
 * as a plain, non-hook function so it can be exercised directly in specs (`useState` setters cannot
 * be meaningfully invoked under `renderToStaticMarkup`).
 *
 * @param {object} params - Builder parameters.
 * @param {object} params.controller - Document controller, used to reload the document after a
 *   successful upload.
 * @param {{upload: boolean, fileUpload: boolean, giveDocument: boolean}} params.visible -
 *   Current visibility of each modal.
 * @param {{upload: Function, fileUpload: Function, giveDocument: Function}} params.setVisible -
 *   State setters for each modal's visibility.
 * @returns {{clickHandlers: object, buildModalProps: Function}} `clickHandlers` opens each modal;
 *   `buildModalProps` receives the paths/permissions known only after loading and returns the
 *   `uploadModal`/`fileUploadModal`/`giveDocumentModal` props for `GameDocumentModals`.
 */
function buildDocumentModals({ controller, visible, setVisible }) {
  return {
    clickHandlers: {
      onUploadClick: () => setVisible.upload(true),
      onFileUploadClick: () => setVisible.fileUpload(true),
      onGiveDocumentClick: () => setVisible.giveDocument(true),
    },
    buildModalProps: ({
      uploadPath, fileUploadPath, buildFilePhotoUploadPath, canGiveHidden,
    }) => ({
      uploadModal: {
        show: visible.upload,
        path: uploadPath,
        onSuccess: buildUploadSuccessHandler(controller, setVisible.upload),
        onClose: () => setVisible.upload(false),
      },
      fileUploadModal: {
        show: visible.fileUpload,
        path: fileUploadPath,
        buildFilePhotoUploadPath,
        onSuccess: buildUploadSuccessHandler(controller, setVisible.fileUpload),
        onClose: () => setVisible.fileUpload(false),
      },
      giveDocumentModal: {
        show: visible.giveDocument,
        canGiveHidden,
        onClose: () => setVisible.giveDocument(false),
      },
    }),
  };
}

/**
 * Owns GameDocument's upload, file-upload and give-document modal visibility state.
 *
 * @param {object} controller - Document controller, used to reload the document after a
 *   successful upload.
 * @returns {{clickHandlers: object, buildModalProps: Function}} `clickHandlers` holds the
 *   `onUploadClick`/`onFileUploadClick`/`onGiveDocumentClick` handlers for
 *   `DocumentDetailHelper.render`; `buildModalProps` builds the modal props for
 *   `GameDocumentModals` from the loaded paths and permissions.
 */
export default function useGameDocumentModals(controller) {
  const [showUpload, setShowUpload] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showGiveDocument, setShowGiveDocument] = useState(false);

  return buildDocumentModals({
    controller,
    visible: { upload: showUpload, fileUpload: showFileUpload, giveDocument: showGiveDocument },
    setVisible: {
      upload: setShowUpload, fileUpload: setShowFileUpload, giveDocument: setShowGiveDocument,
    },
  });
}

export { buildDocumentModals, buildUploadSuccessHandler };
