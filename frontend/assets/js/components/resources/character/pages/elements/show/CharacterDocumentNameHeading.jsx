import React from 'react';

/**
 * Show-mode left-column slot: the `CharacterDocument`'s own name, rendered next to its photo —
 * matching `DocumentNameHeading`'s existing layout for the unrelated `GameDocument` show page.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Document name.
 * @returns {React.ReactElement} Heading element.
 */
export default function CharacterDocumentNameHeading({ name }) {
  return <h1>{name}</h1>;
}
