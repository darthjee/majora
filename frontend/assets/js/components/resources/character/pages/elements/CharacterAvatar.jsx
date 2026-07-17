import CharacterAvatarHelper from './helpers/CharacterAvatarHelper.jsx';

/**
 * Character show-page avatar: the character's picture wrapped in an
 * allegiance-colored border for NPCs, with the upload/slain-toggle overlay
 * buttons the current user is entitled to.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Character data object.
 * @param {string|null} [props.character.profile_photo_path] - Optional profile photo path.
 * @param {string} props.character.name - Character name.
 * @param {boolean} [props.character.can_edit] - Whether the current user may edit this character.
 * @param {boolean} [props.character.is_player] - Whether the current user is a player of the game,
 *   grants upload access (for both PCs and NPCs) even without edit rights.
 * @param {boolean} [props.character.is_staff] - Whether the current user is Django staff, grants
 *   upload access for PCs even without edit rights (does not affect NPC upload eligibility).
 * @param {boolean} [props.character.slain] - Whether the character is (really) slain, or its
 *   public-facing slain alias for a non-editor.
 * @param {boolean} [props.character.public_slain] - Whether the character is publicly slain.
 * @param {boolean} [props.character.is_pc] - Whether the character is a PC.
 * @param {string} [props.character.allegiance] - Allegiance value driving the border color.
 * @param {{onOpenUploadModal: Function, onOpenSlainModal: Function,
 *   onOpenPublicSlainModal: Function, onOpenPlayerSlainModal: Function}} [props.handlers] - Event handlers.
 * @returns {React.ReactElement} Character avatar element.
 */
export default function CharacterAvatar({ character, handlers = {} }) {
  return CharacterAvatarHelper.render(character, handlers);
}
