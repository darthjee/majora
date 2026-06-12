import CharacterInfoHelper from './helpers/CharacterInfoHelper.jsx';

/**
 * Character info panel: name, class, level, and description.
 *
 * @param {object} props - Component props.
 * @param {string} props.name - Character name.
 * @param {string} [props.character_class] - Character class.
 * @param {number|null} [props.level] - Character level.
 * @param {string} [props.description] - Character description.
 * @returns {React.ReactElement} Character info element.
 */
export default function CharacterInfo({ name, character_class, level, description }) {
  return CharacterInfoHelper.render(name, character_class, level, description);
}
