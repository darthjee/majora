import React from 'react';
import ActionsOverlay from '../../../../../common/ActionsOverlay.jsx';

/**
 * Rendering helper for the CharacterAvatarField element.
 */
export default class CharacterAvatarFieldHelper {
  /**
   * Render the avatar overlay, editable or not.
   *
   * @param {string|null} url - Profile photo path, or null for the placeholder.
   * @param {string} alt - Alt text for the avatar image.
   * @param {boolean} canEdit - Whether the upload overlay button is shown.
   * @param {Function} [onClick] - Handler invoked when the upload button is clicked.
   * @returns {React.ReactElement} Avatar field element.
   */
  static render(url, alt, canEdit, onClick) {
    return (
      <ActionsOverlay
        type="avatar"
        url={url}
        alt={alt}
        canEdit={canEdit}
        onClick={onClick}
      />
    );
  }
}
