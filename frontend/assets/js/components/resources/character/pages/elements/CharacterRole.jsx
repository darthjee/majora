import CharacterRoleHelper from './helpers/CharacterRoleHelper.jsx';

/**
 * Character show-page role line, rendered only when a role is set.
 *
 * @param {object} props - Component props.
 * @param {string} [props.role] - Character role.
 * @returns {React.ReactElement|null} Role paragraph, or null.
 */
export default function CharacterRole({ role }) {
  return CharacterRoleHelper.render(role);
}
