import CharacterRoleFieldHelper from './helpers/CharacterRoleFieldHelper.jsx';

/**
 * Editable role field shared by the character edit page and the NPC
 * creation page. Renders nothing when the current editor is not a full
 * editor (role is a dm/admin-only concern).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isFullEditor - Whether the current editor may see/edit the role.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the input.
 * @param {string} props.label - Translated role field label.
 * @param {string} props.value - Current role value.
 * @param {Function} props.onChange - Change handler for the input.
 * @param {string[]} [props.errors] - Field-level error messages to display below the input.
 * @returns {React.ReactElement|null} Role field element, or null.
 */
export default function CharacterRoleField({
  isFullEditor, id, label, value, onChange, errors = [],
}) {
  return CharacterRoleFieldHelper.render(isFullEditor, id, label, value, onChange, errors);
}
