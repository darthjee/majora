import React from 'react';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import Badge from './Badge.jsx';
import InfoBadgeList from './InfoBadgeList.jsx';

/**
 * Renders a small icon-only badge that reveals a tooltip listing the given
 * status items (icon + colored text each) on hover/focus, using
 * `react-bootstrap`'s `OverlayTrigger`/`Tooltip`. The visible badge itself
 * carries no color, since it merely reveals other items' colors.
 *
 * @param {object} props - Component props.
 * @param {string} props.icon - Bootstrap Icons class name rendered as the badge's visible icon.
 * @param {{icon: string, text: string, variant: string|null}[]} [props.items] - Status item
 *   definitions rendered inside the tooltip via `InfoBadgeList`.
 * @returns {React.ReactElement} Tooltip badge element.
 */
export default function TooltipBadge({ icon, items = [] }) {
  return (
    <OverlayTrigger
      placement="bottom"
      overlay={(
        <Tooltip>
          <InfoBadgeList items={items} />
        </Tooltip>
      )}
    >
      <span className="d-inline-block">
        <Badge icon={icon} />
      </span>
    </OverlayTrigger>
  );
}
