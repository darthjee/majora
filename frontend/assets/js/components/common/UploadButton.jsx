import React from 'react';

/**
 * Secondary "upload" action button rendered as a button element.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onClick - Click handler invoked when the button is pressed.
 * @param {string} props.label - Accessible name for the button, set as both
 *   `aria-label` and `title`.
 * @param {React.ReactNode} props.children - Icon or other visible content rendered inside the button.
 * @returns {React.ReactElement} Upload button element.
 */
export default function UploadButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-secondary mb-3"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
