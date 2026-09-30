import React from 'react';

/**
 * A labeled "Label: value" line used by the recipe show page's scalar fields.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Already-translated label.
 * @param {React.ReactNode} props.children - Rendered value.
 * @returns {React.ReactElement} Labeled line.
 */
export default function RecipeShowLine({ label, children }) {
  return (
    <p>
      <strong>{label}</strong>
      {': '}
      {children}
    </p>
  );
}
