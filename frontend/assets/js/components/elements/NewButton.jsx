import React from 'react';

/**
 * Primary "new" navigation button rendered as an anchor link.
 *
 * @param {object} props - Component props.
 * @param {string} props.href - URL or hash path the button links to.
 * @param {React.ReactNode} props.children - Label text or child elements.
 * @returns {React.ReactElement} New button anchor element.
 */
export default function NewButton({ href, children }) {
  return (
    <a href={href} className="btn btn-primary mb-3">
      {children}
    </a>
  );
}
