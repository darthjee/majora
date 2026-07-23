import React from 'react';

/**
 * Outer shell for a staff dashboard card: a plain bootstrap card, not a link
 * (unlike the games/npcs/items index cards), composing a `top` slot (title +
 * data, see `CardTop`) and an `actions` slot (see `CardActions`).
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.top - Top slot content.
 * @param {React.ReactNode} props.actions - Actions slot content.
 * @returns {React.ReactElement} The rendered card shell.
 */
export default function DashboardCard({ top, actions }) {
  return (
    <div className="card h-100">
      <div className="card-body d-flex flex-column">
        {top}
        {actions}
      </div>
    </div>
  );
}
