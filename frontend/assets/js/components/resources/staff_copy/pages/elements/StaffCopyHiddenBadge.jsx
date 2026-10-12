import Icons from '../../../../../utils/ui/Icons.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * "Hidden" badge of a staff copy source row.
 *
 * @description Rendered only when the source entity is hidden from players; shared by the row
 *   components of the copy types that carry a `hidden` flag.
 * @param {object} props - Component props.
 * @param {boolean} [props.hidden] - Whether the source entity is hidden.
 * @returns {React.ReactElement|null} The badge, or null when not hidden.
 */
export default function StaffCopyHiddenBadge({ hidden }) {
  if (!hidden) {
    return null;
  }

  return (
    <span className="badge text-bg-secondary" data-testid="staff-copy-hidden-badge">
      <i className={`bi ${Icons.eyeSlashFill} me-1`} />
      {Translator.t('staff_copies_page.hidden_badge')}
    </span>
  );
}
