import React from 'react';

/**
 * Show-mode left-column slot: the item's own name, rendered next to its photo — matching
 * `ItemDetailHelper`'s existing layout, unlike `game`/`pc`/`npc`, whose name heading lives in
 * the right column instead.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Item name.
 * @returns {React.ReactElement} Heading element.
 */
export default function ItemNameHeading({ name }) {
  return <h1>{name}</h1>;
}
