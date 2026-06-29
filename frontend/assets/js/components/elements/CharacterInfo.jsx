import CharacterInfoHelper from './helpers/CharacterInfoHelper.jsx';

/**
 * Character info panel: name, role, and description.
 *
 * @param {object} props - Component props.
 * @param {string} props.name - Character name.
 * @param {string} [props.role] - Character role.
 * @param {string} [props.description] - Character description.
 * @returns {React.ReactElement} Character info element.
 */
export default function CharacterInfo({ name, role, description }) {
  return CharacterInfoHelper.render(name, role, description);
}
