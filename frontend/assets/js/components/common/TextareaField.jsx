import FieldErrors from './FieldErrors.jsx';

/**
 * Labeled textarea input wrapped in the project's standard `mb-3` spacing,
 * intended for multi-line text fields such as character descriptions.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the textarea.
 * @param {string} props.label - Translated label text.
 * @param {string} props.value - Current textarea value.
 * @param {Function} props.onChange - Change handler for the textarea.
 * @param {string[]} [props.errors] - Field-level error messages to display below the textarea.
 * @returns {React.ReactElement} Labeled textarea field.
 */
export default function TextareaField({ id, label, value, onChange, errors = [] }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <textarea
        id={id}
        className="form-control"
        value={value}
        onChange={onChange}
      />
      <FieldErrors errors={errors} />
    </div>
  );
}
