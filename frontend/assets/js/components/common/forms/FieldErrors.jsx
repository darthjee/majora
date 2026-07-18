/**
 * Bootstrap danger alerts rendered below a form field, one per error message.
 *
 * @param {object} props - Component props.
 * @param {string[]} props.errors - Field-level error messages to display.
 * @returns {React.ReactElement[]} Rendered error alert elements.
 */
export default function FieldErrors({ errors }) {
  return errors.map((message) => (
    <div key={message} className="alert alert-danger mt-1 mb-0 py-1">{message}</div>
  ));
}
