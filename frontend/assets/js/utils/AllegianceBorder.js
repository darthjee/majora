const BORDER_COLOR_CLASSES = {
  ally: 'border-success',
  enemy: 'border-danger',
};

const DEFAULT_BORDER_COLOR_CLASS = 'border-secondary';

/**
 * Resolve the Bootstrap border utility classes reflecting an NPC's allegiance.
 *
 * @param {string} [allegiance] - Allegiance value (`'ally'`, `'enemy'`, `'neutral'`,
 *   or missing), as resolved by the backend for the current user.
 * @returns {string} Bootstrap border classes: `'border border-success'` for `'ally'`,
 *   `'border border-danger'` for `'enemy'`, and `'border border-secondary'` for
 *   anything else (`'neutral'` or missing).
 */
export default function allegianceBorderClass(allegiance) {
  const colorClass = BORDER_COLOR_CLASSES[allegiance] ?? DEFAULT_BORDER_COLOR_CLASS;

  return `border ${colorClass}`;
}
