/**
 * Bootstrap alert inside a container, used for page-level error states.
 *
 * @param {object} props - Component props.
 * @param {string} props.error - Error message to display.
 * @param {string} [props.variant] - Bootstrap alert variant (`'danger'` by default, `'warning'`
 *   for recoverable/configuration problems).
 * @returns {React.ReactElement} Error alert element.
 */
export default function ErrorAlert({ error, variant = 'danger' }) {
  return (
    <div className="container mt-4">
      <div className={`alert alert-${variant}`} role="alert">{error}</div>
    </div>
  );
}
