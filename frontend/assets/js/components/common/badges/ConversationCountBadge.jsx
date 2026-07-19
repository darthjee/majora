import React from 'react';
import OverlayTrigger from 'react-bootstrap/cjs/OverlayTrigger.js';
import Tooltip from 'react-bootstrap/cjs/Tooltip.js';
import Badge from './Badge.jsx';

/**
 * Renders a small icon+count badge (e.g. a conversation-following or unread-conversation count)
 * that reveals a tooltip with additional context on hover/focus, using `react-bootstrap`'s
 * `OverlayTrigger`/`Tooltip` — the same structure `TooltipBadge` uses, but showing a visible
 * count next to the icon instead of a hidden status list.
 *
 * @param {object} props - Component props.
 * @param {string} props.icon - Bootstrap Icons class name rendered as the badge's icon.
 * @param {string|number} props.text - Count shown next to the icon.
 * @param {string} props.tooltip - Already-translated tooltip text shown on hover/focus.
 * @returns {React.ReactElement} Conversation count badge element.
 */
export default function ConversationCountBadge({ icon, text, tooltip }) {
  return (
    <OverlayTrigger placement="bottom" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span className="d-inline-block">
        <Badge icon={icon} text={text} />
      </span>
    </OverlayTrigger>
  );
}
