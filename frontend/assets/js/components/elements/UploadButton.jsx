import React from 'react';

/**
 * Secondary "upload" action button rendered as a button element.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onClick - Click handler invoked when the button is pressed.
 * @param {React.ReactNode} props.children - Label text or child elements.
 * @returns {React.ReactElement} Upload button element.
 */
export default function UploadButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-secondary mb-3">
      {children}
    </button>
  );
}
