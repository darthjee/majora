/**
 * Labeled form input wrapped in the project's standard `mb-3` spacing,
 * reused across login, registration, and password-recovery forms.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Id shared between the label's `htmlFor` and the input.
 * @param {string} props.type - Input type (e.g. `text`, `email`, `password`).
 * @param {string} props.label - Translated label text.
 * @param {string} props.value - Current input value.
 * @param {Function} props.onChange - Change handler for the input.
 * @returns {React.ReactElement} Labeled form field.
 */
export default function FormField({ id, type, label, value, onChange }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        type={type}
        className="form-control"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
