/**
 * Centered loading message inside a container, used for page-level loading states.
 *
 * @param {object} props - Component props.
 * @param {string} props.message - Loading message to display.
 * @returns {React.ReactElement} Loading message element.
 */
export default function LoadingMessage({ message }) {
  return (
    <div className="container mt-4 text-center">
      <p className="text-muted">{message}</p>
    </div>
  );
}
