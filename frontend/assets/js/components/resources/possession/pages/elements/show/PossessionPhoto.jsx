import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';
import ItemCardHelper from '../../../../../common/list_types/ItemCardHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the possession's photo, with an upload affordance gated on the
 * requester's own upload permission (`canUploadPhoto`, resolved per-page) and a Hidden badge
 * when the possession is hidden from players, delegating to `ItemCardHelper` (reused as-is, not
 * duplicated into a `PossessionCardHelper` — it's already generic over any `{hidden}` entity),
 * mirroring `ItemPhoto`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Possession photo URL.
 * @param {string} context.name - Possession name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the possession is hidden from players.
 * @param {boolean} [context.canUploadPhoto] - Whether the current user may upload a new photo.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Possession photo overlay element.
 */
function PossessionPhotoShow({
  photo_path: photoPath, name, hidden, canUploadPhoto, handlers,
}) {
  return (
    <ActionsOverlay
      type="possession"
      url={photoPath}
      alt={name}
      canEdit={Boolean(canUploadPhoto)}
      onClick={handlers.onOpenUploadModal}
      overlayItems={{
        infoBarItems: ItemCardHelper.buildInfoBarItems({ hidden }, Translator.t('possession_page.hidden_label')),
      }}
    />
  );
}

/**
 * Edit-mode left-column slot: the possession's photo, always editable (the edit route is already
 * permission-gated), dimmed whenever the `hidden` switch is on, mirroring `ItemPhoto`'s edit
 * variant.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Possession photo URL.
 * @param {string} context.name - Possession name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the possession is currently marked hidden.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Possession photo overlay element.
 */
function PossessionPhotoEdit({
  photo_path: photoPath, name, hidden, handlers,
}) {
  return (
    <ActionsOverlay
      type="possession"
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
 * underlying `GamePossession` exists — the picked file is held in the caller's state and
 * uploaded only after creation succeeds, mirroring `ItemPhoto`'s new variant.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Preview URL for the currently picked photo, if any.
 * @param {string} context.name - Possession name field value, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the possession is currently marked hidden.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Possession photo overlay element.
 */
function PossessionPhotoNew({
  photo_path: photoPath, name, hidden, handlers,
}) {
  return (
    <ActionsOverlay
      type="possession"
      url={photoPath}
      alt={name}
      canEdit
      onClick={handlers.onOpenUploadModal}
      dimmed={hidden}
    />
  );
}

/**
 * Mode-variant photo slot for the possession show/new/edit pages.
 */
const PossessionPhoto = { Show: PossessionPhotoShow, Edit: PossessionPhotoEdit, New: PossessionPhotoNew };

export default PossessionPhoto;
