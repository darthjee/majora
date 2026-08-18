import React from 'react';

/**
 * Show-mode left-column slot: the common item's own name, rendered next to its photo — matching
 * `CommonItemDetailHelper`'s layout, mirroring `PossessionNameHeading` exactly.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Common item name.
 * @returns {React.ReactElement} Heading element.
 */
export default function CommonItemNameHeading({ name }) {
  return <h1>{name}</h1>;
}
