import CharacterPreviewCardHelper from './helpers/CharacterPreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single character's photo, styled like
 * `SeeAllCard`, for use in the game page's PC/NPC preview sections.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Character data object.
 * @param {number} props.character.id - Character ID.
 * @param {string} props.character.name - Character name.
 * @param {string|null} [props.character.profile_photo_path] - Optional profile photo path.
 * @param {boolean} [props.character.slain] - Whether the character is slain (NPC only).
 * @param {string} [props.character.allegiance] - Allegiance value (`'ally'`, `'enemy'`,
 *   `'neutral'`, or missing), drives the card border color for NPCs only.
 * @param {string} props.gameSlug - Game slug used to build the detail link.
 * @param {string} props.characterType - Character type, either 'pc' or 'npc'.
 * @returns {React.ReactElement} Character preview card element.
 */
export default function CharacterPreviewCard({ character, gameSlug, characterType }) {
  return CharacterPreviewCardHelper.render(character, gameSlug, characterType);
}
