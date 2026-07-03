import React from 'react';

/**
 * Renders a list of external links, each as its own clickable Bootstrap card.
 * Returns null when the links array is falsy or empty.
 *
 * @param {object} props - Component props.
 * @param {object[]} [props.links] - Array of link objects.
 * @param {string} props.links[].url - Link URL, used as the React key.
 * @param {string} props.links[].text - Anchor text to display.
 * @returns {React.ReactElement|null} Stack of link cards, or null.
 */
export default function LinkList({ links }) {
  if (!links || links.length === 0) return null;

  return (
    <div>
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="text-decoration-none text-dark"
        >
          <div className="card mb-2">
            <div className="card-body py-2">
              <i className="bi bi-link-45deg"></i> {link.text}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
