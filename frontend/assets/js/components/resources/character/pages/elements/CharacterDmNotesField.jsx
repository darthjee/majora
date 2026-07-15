import CharacterDmNotesFieldHelper from './helpers/CharacterDmNotesFieldHelper.jsx';

/**
 * Editable DM notes (private description) field shared by the character
 * edit page and the NPC creation page. Renders nothing when the current
 * editor is not a full editor (DM notes are a dm/admin-only concern).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isFullEditor - Whether the current editor may see/edit DM notes.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the textarea.
 * @param {string} props.label - Translated DM notes field label.
 * @param {string} props.value - Current private description value.
 * @param {Function} props.onChange - Change handler for the textarea.
 * @param {string[]} [props.errors] - Field-level error messages to display below the textarea.
 * @returns {React.ReactElement|null} DM notes field element, or null.
 */
export default function CharacterDmNotesField({
  isFullEditor, id, label, value, onChange, errors = [],
}) {
  return CharacterDmNotesFieldHelper.render(isFullEditor, id, label, value, onChange, errors);
}
