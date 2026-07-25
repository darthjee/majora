import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';
import ItemCardHelper from '../../../../../common/list_types/ItemCardHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the document's photo, with an upload affordance gated on the
 * requester's own upload permission (`canUploadPhoto`, resolved per-page) and a Hidden badge
 * when the document is hidden from players, delegating to `ItemCardHelper` the same way
 * `ItemPhotoShow` does (issue #727).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Document photo URL.
 * @param {string} context.name - Document name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the document is hidden from players.
 * @param {boolean} [context.canUploadPhoto] - Whether the current user may upload a new photo.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Document photo overlay element.
 */
function DocumentPhotoShow({
  photo_path: photoPath, name, hidden, canUploadPhoto, handlers,
}) {
  return (
    <ActionsOverlay
      type="document"
      url={photoPath}
      alt={name}
      canEdit={Boolean(canUploadPhoto)}
      onClick={handlers.onOpenUploadModal}
      infoBarItems={ItemCardHelper.buildInfoBarItems({ hidden }, Translator.t('document_page.hidden_label'))}
    />
  );
}

/**
 * Edit-mode left-column slot: the document's photo, always editable (the edit route is already
 * permission-gated), dimmed whenever the `hidden` switch is on — mirroring `ItemPhotoEdit`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Document photo URL.
 * @param {string} context.name - Document name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the document is currently marked hidden.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Document photo overlay element.
 */
function DocumentPhotoEdit({
  photo_path: photoPath, name, hidden, handlers,
}) {
  return (
    <ActionsOverlay
      type="document"
      url={photoPath}
      alt={name}
      canEdit
      onClick={handlers.onOpenUploadModal}
      dimmed={hidden}
    />
  );
}

/**
 * New-mode left-column slot: a deferred photo picker, letting the user pick a photo before the
 * underlying `GameDocument` exists — the picked file is held in the caller's state and uploaded
 * only after creation succeeds, mirroring `ItemPhotoNew`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Preview URL for the currently picked photo, if any.
 * @param {string} context.name - Document name field value, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the document is currently marked hidden.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Document photo overlay element.
 */
function DocumentPhotoNew({
  photo_path: photoPath, name, hidden, handlers,
}) {
  return (
    <ActionsOverlay
      type="document"
      url={photoPath}
      alt={name}
      canEdit
      onClick={handlers.onOpenUploadModal}
      dimmed={hidden}
    />
  );
}

/**
 * Mode-variant photo slot for the document show/new/edit pages (issue #727).
 */
const DocumentPhoto = { Show: DocumentPhotoShow, Edit: DocumentPhotoEdit, New: DocumentPhotoNew };

export default DocumentPhoto;
