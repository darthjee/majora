import React from 'react';

/**
 * Secondary "edit" navigation button rendered as an anchor link.
 *
 * @param {object} props - Component props.
 * @param {string} props.href - URL or hash path the button links to.
 * @param {React.ReactNode} props.children - Label text or child elements.
 * @returns {React.ReactElement} Edit button anchor element.
 */
export default function EditButton({ href, children }) {
  return (
    <a href={href} className="btn btn-secondary mb-3">
      {children}
    </a>
  );
}
