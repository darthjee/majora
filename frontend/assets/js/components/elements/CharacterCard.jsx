import CharacterCardHelper from './helpers/CharacterCardHelper.jsx';
import Noop from '../../utils/Noop.js';

/**
 * Bootstrap card representing a single character.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Character data object.
 * @param {number} props.character.id - Character ID.
 * @param {string} props.character.name - Character name.
 * @param {string|null} [props.character.profile_photo_path] - Optional profile photo path.
 * @param {boolean} [props.character.slain] - Whether the character is slain (NPC only).
 * @param {string} props.gameSlug - Game slug used to build the detail link.
 * @param {string} props.characterType - Character type, either 'pc' or 'npc'.
 * @param {string} [props.size] - Card size, either 'normal' or 'small'.
 * @param {boolean} [props.canEdit] - Whether the current user may edit this NPC
 *   (meaningful only when characterType is 'npc').
 * @param {Function} [props.onUploadClick] - Called with the character object when the
 *   upload overlay button is clicked (NPC only).
 * @param {Function} [props.onSlainClick] - Called with the character object when the
 *   slain/revive overlay button is clicked (NPC only).
 * @returns {React.ReactElement} Character card element.
 */
export default function CharacterCard({
  character, gameSlug, characterType, size = 'normal',
  canEdit = false, onUploadClick = Noop.noop, onSlainClick = Noop.noop,
}) {
  return CharacterCardHelper.render(
    character, gameSlug, characterType, size, canEdit, onUploadClick, onSlainClick,
  );
}
