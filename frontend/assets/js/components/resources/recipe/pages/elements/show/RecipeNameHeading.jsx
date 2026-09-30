import React from 'react';

/**
 * Show-mode left-column slot: the recipe's own name, rendered next to its output photo,
 * mirroring `CommonItemNameHeading`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Recipe name.
 * @returns {React.ReactElement} Heading element.
 */
export default function RecipeNameHeading({ name }) {
  return <h1>{name}</h1>;
}
