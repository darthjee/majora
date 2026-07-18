import React from 'react';

/**
 * Renders a vertical list of status items (icon + colored text each), used
 * as the content of a `TooltipBadge`'s tooltip. Returns null when there are
 * no items to show, since it decides on its own whether it has anything to
 * render.
 *
 * @param {object} props - Component props.
 * @param {{icon: string, text: string, variant: string|null}[]} [props.items] - Status item
 *   definitions to render, in order.
 * @returns {React.ReactElement|null} Info badge list element, or null when `items` is empty.
 */
export default function InfoBadgeList({ items = [] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="info-badge-list list-unstyled text-start mb-0">
      {items.map((item, index) => (
        <li
          key={`${item.text}-${index}`}
          className={`info-badge-list-item ${item.variant ? `text-${item.variant}` : 'info-badge-list-item-neutral'}`}
        >
          <i className={`bi ${item.icon}`} aria-hidden="true"></i>
          {' '}
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
