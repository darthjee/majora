import React from 'react';

/**
 * Show-mode left-column slot: the document's own name, rendered next to its photo — matching
 * `ItemNameHeading`'s existing layout.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Document name.
 * @returns {React.ReactElement} Heading element.
 */
export default function DocumentNameHeading({ name }) {
  return <h1>{name}</h1>;
}
