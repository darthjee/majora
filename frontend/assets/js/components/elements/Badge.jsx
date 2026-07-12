import React from 'react';

/**
 * Minimal Bootstrap badge pill primitive, shared by icon-only badges (e.g.
 * `TooltipBadge`'s visible trigger) and text-only badges (e.g. the treasure
 * card's quantity indicator), so both share one bespoke-markup-free mechanism.
 *
 * @param {object} props - Component props.
 * @param {string} [props.icon] - Optional Bootstrap Icons class name rendered before the text.
 * @param {string|number} [props.text] - Optional badge text.
 * @param {string} [props.variant] - Bootstrap color variant (e.g. `'secondary'`, `'danger'`).
 * @returns {React.ReactElement} Badge element.
 */
export default function Badge({ icon, text, variant = 'secondary' }) {
  return (
    <span className={`badge bg-${variant}`}>
      {icon && <i className={`bi ${icon}`} aria-hidden="true"></i>}
      {text}
    </span>
  );
}
