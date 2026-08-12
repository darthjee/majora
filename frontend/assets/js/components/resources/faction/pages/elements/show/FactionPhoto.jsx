import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';

/**
 * Show-mode left-column slot: the faction's photo, with an upload affordance gated on the
 * requester's own upload permission (`canUploadPhoto`, resolved per-page), mirroring
 * `ItemPhoto`/`PossessionPhoto` minus the Hidden badge — `Faction` has no hidden concept.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Faction photo URL.
 * @param {string} context.name - Faction name, used as the image's alt text.
 * @param {boolean} [context.canUploadPhoto] - Whether the current user may upload a new photo.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Faction photo overlay element.
 */
function FactionPhotoShow({
  photo_path: photoPath, name, canUploadPhoto, handlers,
}) {
  return (
    <ActionsOverlay
      type="faction"
      url={photoPath}
      alt={name}
      canEdit={Boolean(canUploadPhoto)}
      onClick={handlers.onOpenUploadModal}
    />
  );
}

/**
 * Edit-mode left-column slot: the faction's photo, always editable (the edit route is already
 * DM/staff-gated), mirroring `ItemPhoto`/`PossessionPhoto`'s edit variant minus the `dimmed`
 * concept — `Faction` has no hidden switch.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Faction photo URL.
 * @param {string} context.name - Faction name, used as the image's alt text.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Faction photo overlay element.
 */
function FactionPhotoEdit({ photo_path: photoPath, name, handlers }) {
  return (
    <ActionsOverlay
      type="faction"
      url={photoPath}
      alt={name}
      canEdit
      onClick={handlers.onOpenUploadModal}
    />
  );
}

/**
 * Mode-variant photo slot for the faction show/edit pages (issue #812) — no `New` variant, since
 * faction creation is modal-based (`FactionNewModal.jsx`/`FactionPhotoField.jsx`), not backed by
 * `ShowPageLayout`.
 */
const FactionPhoto = { Show: FactionPhotoShow, Edit: FactionPhotoEdit };

export default FactionPhoto;
