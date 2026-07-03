import CharacterInfoHelper from './helpers/CharacterInfoHelper.jsx';

/**
 * Character info panel: role and description.
 *
 * @param {object} props - Component props.
 * @param {string} [props.role] - Character role.
 * @param {string} [props.description] - Character description.
 * @returns {React.ReactElement} Character info element.
 */
export default function CharacterInfo({ role, description }) {
  return CharacterInfoHelper.render(role, description);
}
