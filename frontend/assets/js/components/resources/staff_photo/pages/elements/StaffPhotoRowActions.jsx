import Translator from '../../../../../i18n/Translator.js';
import Icons from '../../../../../utils/ui/Icons.js';

/**
 * Resize / Replace / Delete actions of a staff photo row.
 *
 * @description Replace is disabled while a replace is in progress or when the photo has no
 *   path; Resize additionally requires the photo to be ready; Delete is disabled only while a
 *   replace is in progress. Every button is disabled while a bulk job runs.
 * @param {object} props - Component props.
 * @param {{path: string, ready: boolean, replace_in_progress: boolean}} props.photo - The
 *   photo row.
 * @param {Function} props.onResize - Called with the photo when Resize is clicked.
 * @param {Function} props.onReplace - Called with the photo when Replace is clicked.
 * @param {Function} props.onDelete - Called with the photo when Delete is clicked.
 * @param {boolean} [props.disabled] - Disables every action (bulk job running).
 * @returns {React.ReactElement} Row action buttons.
 */
export default function StaffPhotoRowActions({
  photo, onResize, onReplace, onDelete, disabled = false,
}) {
  const blocked = disabled || Boolean(photo.replace_in_progress);
  const replaceBlocked = blocked || !photo.path;

  return (
    <div className="d-flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        disabled={replaceBlocked || !photo.ready}
        onClick={() => onResize(photo)}
      >
        <i className={`bi ${Icons.arrowsCollapse} me-1`} aria-hidden="true" />
        {Translator.t('staff_photos_page.resize')}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        disabled={replaceBlocked}
        onClick={() => onReplace(photo)}
      >
        <i className={`bi ${Icons.arrowClockwise} me-1`} aria-hidden="true" />
        {Translator.t('staff_photos_page.replace')}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        disabled={blocked}
        onClick={() => onDelete(photo)}
      >
        <i className={`bi ${Icons.trash} me-1`} aria-hidden="true" />
        {Translator.t('staff_photos_page.delete')}
      </button>
    </div>
  );
}
