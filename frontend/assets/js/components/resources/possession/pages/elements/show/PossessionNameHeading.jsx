import React from 'react';

/**
 * Show-mode left-column slot: the possession's own name, rendered next to its photo — matching
 * `PossessionDetailHelper`'s layout, mirroring `ItemNameHeading` exactly.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Possession name.
 * @returns {React.ReactElement} Heading element.
 */
export default function PossessionNameHeading({ name }) {
  return <h1>{name}</h1>;
}
