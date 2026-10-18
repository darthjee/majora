import React from 'react';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';

/**
 * Wraps inline content in a `react-bootstrap` `OverlayTrigger`/`Tooltip` pair, revealing
 * `content` on hover/focus (same pattern as `CardHoverTooltip`, but inline instead of
 * full-width). Used by the API token cells for the "All games" badge and the expiry date.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.content - Tooltip content.
 * @param {React.ReactNode} props.children - Trigger content the tooltip is attached to.
 * @returns {React.ReactElement} Inline hover-tooltip wrapper element.
 */
export default function InlineTooltip({ content, children }) {
  return (
    <OverlayTrigger placement="bottom" overlay={<Tooltip>{content}</Tooltip>}>
      <span className="d-inline-block" tabIndex={0}>
        {children}
      </span>
    </OverlayTrigger>
  );
}
