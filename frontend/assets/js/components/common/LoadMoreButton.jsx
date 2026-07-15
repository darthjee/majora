/**
 * Button for cursor-based "load more" pagination, shown only while more items remain.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.visible - Whether more items remain to load.
 * @param {boolean} props.loading - Whether a load is currently in flight.
 * @param {Function} props.onClick - Click handler to fetch the next page.
 * @param {string} props.label - Button label.
 * @returns {React.ReactElement|null} Button element, or null when not visible.
 */
export default function LoadMoreButton({
  visible, loading, onClick, label,
}) {
  if (!visible) return null;

  return (
    <button type="button" className="btn btn-outline-secondary mt-3" onClick={onClick} disabled={loading}>
      {label}
    </button>
  );
}
