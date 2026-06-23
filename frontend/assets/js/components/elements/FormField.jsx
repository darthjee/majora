/**
 * Render the field-level error alerts below the input.
 *
 * @param {string[]} errors - Field-level error messages to display.
 * @returns {React.ReactElement[]} Rendered error alert elements.
 */
function renderErrors(errors) {
  return errors.map((message) => (
    <div key={message} className="alert alert-danger mt-1 mb-0 py-1">{message}</div>
  ));
}

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
 * @param {string[]} [props.errors] - Field-level error messages to display below the input.
 * @returns {React.ReactElement} Labeled form field.
 */
export default function FormField({ id, type, label, value, onChange, errors = [] }) {
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
      {renderErrors(errors)}
    </div>
  );
}
