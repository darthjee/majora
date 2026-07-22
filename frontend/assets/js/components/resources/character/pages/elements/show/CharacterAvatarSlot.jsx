import React from 'react';
import CharacterAvatarHelper from '../helpers/CharacterAvatarHelper.jsx';
import CharacterAvatarField from '../CharacterAvatarField.jsx';

/**
 * Show-mode left-column slot: the character's picture, action bar, and (for NPCs) allegiance
 * border, reusing `CharacterAvatarHelper.render` as-is (the same rendering already shared by the
 * PC and NPC show pages today).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context (the loaded character,
 *   spread, plus `handlers`).
 * @param {object} context.handlers - Event handlers (`onOpenUploadModal`, `onOpenSlainModal`,
 *   `onOpenPublicSlainModal`, `onOpenPlayerSlainModal`).
 * @returns {React.ReactElement} Character avatar element.
 */
function CharacterAvatarShow(context) {
  return CharacterAvatarHelper.render(context, context.handlers ?? {});
}

/**
 * New/edit-mode left-column slot: the editable avatar field, dimmed while the character is
 * marked hidden (a no-op for PCs, which never expose a hidden toggle and so never set it).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.profile_photo_path] - Current profile photo path/preview URL.
 * @param {string} context.name - Current name field value, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the character is currently marked hidden.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Editable avatar field element.
 */
function CharacterAvatarEditOrNew({
  profile_photo_path: profilePhotoPath, name, hidden = false, handlers,
}) {
  return (
    <CharacterAvatarField
      url={profilePhotoPath}
      alt={name}
      onClick={handlers.onOpenUploadModal}
      dimmed={hidden}
    />
  );
}

/**
 * `showTypeConfig` left-column avatar slot, shared by the `pc` and `npc` show/new/edit pages.
 */
const CharacterAvatarSlot = {
  Show: CharacterAvatarShow,
  New: CharacterAvatarEditOrNew,
  Edit: CharacterAvatarEditOrNew,
};

export default CharacterAvatarSlot;
