import React from 'react';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';

/**
 * Wraps arbitrary card content in a `react-bootstrap` `OverlayTrigger`/`Tooltip`
 * pair (same pattern as `TooltipBadge`), revealing `content` on hover/focus
 * instead of showing it inline. Used by preview cards (`CharacterPreviewCard`,
 * `TreasurePreviewCard`) whose photo-only layout has no room for always-visible text.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.content - Tooltip content, e.g. plain text or
 *   richer markup such as a name plus a money value.
 * @param {React.ReactNode} props.children - Trigger element the tooltip is attached to.
 * @returns {React.ReactElement} Hover-tooltip wrapper element.
 */
export default function CardHoverTooltip({ content, children }) {
  return (
    <OverlayTrigger
      placement="bottom"
      overlay={(
        <Tooltip>
          {content}
        </Tooltip>
      )}
    >
      <div className="d-inline-block w-100">
        {children}
      </div>
    </OverlayTrigger>
  );
}
