import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';

/**
 * Cover photo slot for the game show/edit pages, adapting `ShowPageLayout`'s merged
 * `context` (`cover_photo_path`, `name`, `can_edit`, `mode`, `handlers.onOpenUploadModal`)
 * into `ActionsOverlay`'s prop shape. On the edit page the current user is always allowed to
 * upload (the edit route is already permission-gated), while on the show page upload is gated
 * by `can_edit`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.cover_photo_path] - Cover photo URL.
 * @param {string} context.name - Game name, used as the image's alt text.
 * @param {boolean} [context.can_edit] - Whether the current user can edit this game (show mode).
 * @param {'show'|'edit'} context.mode - Current page mode.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Cover photo overlay element.
 */
export default function GameCoverPhoto({
  cover_photo_path: coverPhotoPath, name, can_edit: canEdit, mode, handlers,
}) {
  return (
    <ActionsOverlay
      url={coverPhotoPath}
      alt={name}
      canEdit={mode === 'edit' ? true : Boolean(canEdit)}
      onClick={handlers.onOpenUploadModal}
    />
  );
}
