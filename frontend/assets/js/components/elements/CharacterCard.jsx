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
 * @returns {React.ReactElement} Character card element.
 */
export default function CharacterCard({ character, gameSlug }) {
  return CharacterCardHelper.render(character, gameSlug);
}
