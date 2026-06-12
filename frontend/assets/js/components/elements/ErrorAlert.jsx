/**
 * Bootstrap danger alert inside a container, used for page-level error states.
 *
 * @param {object} props - Component props.
 * @param {string} props.error - Error message to display.
 * @returns {React.ReactElement} Error alert element.
 */
export default function ErrorAlert({ error }) {
  return (
    <div className="container mt-4">
      <div className="alert alert-danger" role="alert">{error}</div>
    </div>
  );
}
