import CharacterCardHelper from './helpers/CharacterCardHelper.jsx';

/**
 * Bootstrap card representing a single character.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Character data object.
 * @param {number} props.character.id - Character ID.
 * @param {string} props.character.name - Character name.
 * @param {string|null} [props.character.avatar_url] - Optional avatar URL.
 * @param {string} props.gameSlug - Game slug used to build the detail link.
 * @param {string} props.characterType - Character type, either 'pc' or 'npc'.
 * @param {string} [props.size] - Card size, either 'normal' or 'small'.
 * @returns {React.ReactElement} Character card element.
 */
export default function CharacterCard({ character, gameSlug, characterType, size = 'normal' }) {
  return CharacterCardHelper.render(character, gameSlug, characterType, size);
}
