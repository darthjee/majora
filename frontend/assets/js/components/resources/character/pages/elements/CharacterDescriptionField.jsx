import CharacterDescriptionFieldHelper from './helpers/CharacterDescriptionFieldHelper.jsx';

/**
 * Editable public description field shared by the character edit page and
 * the NPC creation page. Unlike role/money/DM notes, it is visible to every
 * editor, including player-only editors of their own PC.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the textarea.
 * @param {string} props.label - Translated description field label.
 * @param {string} props.value - Current description value.
 * @param {Function} props.onChange - Change handler for the textarea.
 * @param {string[]} [props.errors] - Field-level error messages to display below the textarea.
 * @returns {React.ReactElement} Description field element.
 */
export default function CharacterDescriptionField({ id, label, value, onChange, errors = [] }) {
  return CharacterDescriptionFieldHelper.render(id, label, value, onChange, errors);
}
