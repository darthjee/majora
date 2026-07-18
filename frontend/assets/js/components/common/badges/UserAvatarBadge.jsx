import React from 'react';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';

/**
 * Renders a small circular user avatar that reveals a tooltip with the user's display name on
 * hover/focus, using `react-bootstrap`'s `OverlayTrigger`/`Tooltip` — the same structure
 * `TooltipBadge` uses, but rendering a circular `<img>` instead of an icon `Badge`.
 *
 * @param {object} props - Component props.
 * @param {string} props.photoUrl - The user's avatar photo URL.
 * @param {string} props.displayName - The user's display name, shown in the tooltip and as the
 *   image's `alt` text.
 * @returns {React.ReactElement} User avatar badge element.
 */
export default function UserAvatarBadge({ photoUrl, displayName }) {
  return (
    <OverlayTrigger placement="bottom" overlay={<Tooltip>{displayName}</Tooltip>}>
      <img src={photoUrl} alt={displayName} className="user-avatar-badge rounded-circle" />
    </OverlayTrigger>
  );
}
