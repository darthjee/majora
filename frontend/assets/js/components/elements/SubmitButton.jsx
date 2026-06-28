import React from 'react';

/**
 * Primary submit button for forms.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.disabled - Whether the button is disabled.
 * @param {React.ReactNode} props.children - Label text or child elements.
 * @returns {React.ReactElement} Submit button element.
 */
export default function SubmitButton({ disabled, children }) {
  return (
    <button
      className="btn btn-primary"
      type="submit"
      disabled={disabled}
    >
      {children}
    </button>
  );
}
