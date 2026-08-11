import React from 'react';
import Icons from '../../../utils/ui/Icons.js';

/**
 * Bootstrap badge pill with a trailing remove ("x") button, shared by every removable-chip UI
 * (STL model creation tags, `MultiResourcePickerField` selections). Mirrors `Badge`'s `text`/
 * `icon`/`variant` props (no built-in i18n) and adds `onRemove`/`removeLabel` for the remove
 * button.
 *
 * @param {object} props - Component props.
 * @param {string|number} props.text - Badge text.
 * @param {string} [props.icon] - Optional Bootstrap Icons class name rendered before the text.
 * @param {string} [props.variant] - Bootstrap color variant (e.g. `'secondary'`, `'danger'`).
 * @param {Function} props.onRemove - Handler invoked when the remove button is clicked.
 * @param {string} props.removeLabel - Caller-supplied translated label for the remove button's
 *   `aria-label`.
 * @returns {React.ReactElement} Removable badge element.
 */
export default function RemovableBadge({
  text, icon, variant = 'secondary', onRemove, removeLabel,
}) {
  return (
    <span className={`badge bg-${variant} d-inline-flex align-items-center gap-1`}>
      {icon && <i className={`bi ${icon}`} aria-hidden="true"></i>}
      {text}
      <button type="button" className="btn btn-link p-0 text-white" aria-label={removeLabel} onClick={onRemove}>
        <i className={`bi ${Icons.close}`} aria-hidden="true"></i>
      </button>
    </span>
  );
}
