import React from 'react';

/**
 * Renders a list of external links.
 * Returns null when the links array is falsy or empty.
 *
 * @param {object} props - Component props.
 * @param {object[]} [props.links] - Array of link objects.
 * @param {string} props.links[].url - Link URL, used as the React key.
 * @param {string} props.links[].text - Anchor text to display.
 * @returns {React.ReactElement|null} Unordered list of links, or null.
 */
export default function LinkList({ links }) {
  if (!links || links.length === 0) return null;

  return (
    <ul>
      {links.map((link) => (
        <li key={link.url}>
          <a href={link.url} target="_blank" rel="noreferrer">{link.text}</a>
        </li>
      ))}
    </ul>
  );
}
