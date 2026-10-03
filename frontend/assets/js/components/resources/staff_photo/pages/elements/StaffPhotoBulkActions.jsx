import Translator from '../../../../../i18n/Translator.js';
import Icons from '../../../../../utils/ui/Icons.js';

const PREFIX = 'staff_photos_page';

/**
 * Bulk action bar of the staff photos page (issue #1474).
 *
 * @description Holds the "select all on this page" toggle, the selected count and the
 *   Resize selected / Delete selected buttons. The buttons are disabled when nothing is
 *   selected or a bulk job is running; the toggle is disabled while a bulk job is running.
 * @param {object} props - Component props.
 * @param {number} props.count - Number of selected photos.
 * @param {boolean} props.allSelected - Whether every photo of the page is selected.
 * @param {boolean} props.running - Whether a bulk job is running.
 * @param {Function} props.onToggleAll - Called when the select-all toggle changes.
 * @param {Function} props.onBulk - Called with `'resize'` or `'delete'`.
 * @returns {React.ReactElement} Bulk action bar.
 */
export default function StaffPhotoBulkActions({
  count, allSelected, running, onToggleAll, onBulk,
}) {
  const disabled = count === 0 || running;

  return (
    <div className="d-flex flex-wrap align-items-center gap-3 my-3">
      <label className="form-check mb-0">
        <input
          type="checkbox"
          className="form-check-input"
          checked={allSelected}
          disabled={running}
          onChange={onToggleAll}
        />
        <span className="form-check-label">{Translator.t(`${PREFIX}.select_all_page`)}</span>
      </label>
      <span className="text-muted">{Translator.t(`${PREFIX}.bulk_selected`).replace('{{count}}', count)}</span>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        disabled={disabled}
        onClick={() => onBulk('resize')}
      >
        <i className={`bi ${Icons.arrowsCollapse} me-1`} aria-hidden="true" />
        {Translator.t(`${PREFIX}.bulk_resize`)}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        disabled={disabled}
        onClick={() => onBulk('delete')}
      >
        <i className={`bi ${Icons.trash} me-1`} aria-hidden="true" />
        {Translator.t(`${PREFIX}.bulk_delete`)}
      </button>
    </div>
  );
}
