import React from 'react';

/**
 * Renders an always-visible, top-anchored, transparent, borderless bar of
 * informational (non-interactive) items over a character photo, driven by
 * `InfoBarRules`. Unlike `ActionBar`, this bar has no hover-triggered
 * opacity transition: whatever items are given are always shown.
 *
 * @param {object} props - Component props.
 * @param {object[]} [props.items] - Info item definitions to render.
 * @returns {React.ReactElement} Info bar element.
 */
export default function InfoBar({ items = [] }) {
  return (
    <div className="info-overlay">
      {items.map((item, index) => (
        <span key={item.key ?? index} className="info-overlay-item">
          {item.label}
        </span>
      ))}
    </div>
  );
}
