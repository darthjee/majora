import React from 'react';

/**
 * Show-mode left-column slot: the faction's own name, rendered next to its photo — matching
 * `FactionDetailHelper`'s layout, mirroring `ItemNameHeading`/`PossessionNameHeading` exactly.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Faction name.
 * @returns {React.ReactElement} Heading element.
 */
export default function FactionNameHeading({ name }) {
  return <h1>{name}</h1>;
}
