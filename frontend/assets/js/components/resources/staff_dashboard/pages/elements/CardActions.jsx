import React from 'react';
import CardHoverTooltip from '../../../../common/cards/CardHoverTooltip.jsx';

/**
 * Renders a dashboard card's bottom slot: a row of action buttons, each
 * wrapped in a hover tooltip. Reused by every dashboard card type, not just
 * `memory_cache`.
 *
 * @param {object} props - Component props.
 * @param {{icon: string, tooltip: string, onClick: Function, disabled: boolean}[]} props.actions -
 *   Actions to render, one button each. `icon` is a bootstrap-icon class from
 *   `Icons.js` (e.g. `Icons.databaseFillDash`).
 * @returns {React.ReactElement} The rendered actions row.
 */
export default function CardActions({ actions }) {
  return (
    <div className="d-flex justify-content-center gap-2">
      {actions.map((action) => (
        <CardHoverTooltip key={action.tooltip} content={action.tooltip}>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <i className={`bi ${action.icon}`} aria-hidden="true"></i>
          </button>
        </CardHoverTooltip>
      ))}
    </div>
  );
}
