import React from 'react';

/**
 * Renders a dashboard card's top slot: a title plus a clickable data slot.
 * Reused by every dashboard card type, not just `memory_cache`.
 *
 * @param {object} props - Component props.
 * @param {string} props.title - Card title.
 * @param {React.ReactNode} props.data - Data content (e.g. a `PercentageDisplay`).
 * @param {Function} props.onDataClick - Called when the data slot is clicked.
 * @returns {React.ReactElement} The rendered top slot.
 */
export default function CardTop({ title, data, onDataClick }) {
  return (
    <div className="text-center mb-3">
      <h6 className="card-title">{title}</h6>
      <button
        type="button"
        className="btn btn-link p-0 fs-3 text-decoration-none"
        onClick={onDataClick}
      >
        {data}
      </button>
    </div>
  );
}
