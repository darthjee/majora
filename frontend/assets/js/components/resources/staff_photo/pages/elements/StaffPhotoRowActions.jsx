import Translator from '../../../../../i18n/Translator.js';
import Icons from '../../../../../utils/ui/Icons.js';

/**
 * Replace / Delete actions of a staff photo row.
 *
 * @description Replace is disabled while a replace is in progress or when the photo has no
 *   path; Delete is disabled only while a replace is in progress.
 * @param {object} props - Component props.
 * @param {{path: string, replace_in_progress: boolean}} props.photo - The photo row.
 * @param {Function} props.onReplace - Called with the photo when Replace is clicked.
 * @param {Function} props.onDelete - Called with the photo when Delete is clicked.
 * @returns {React.ReactElement} Row action buttons.
 */
export default function StaffPhotoRowActions({ photo, onReplace, onDelete }) {
  const inProgress = Boolean(photo.replace_in_progress);

  return (
    <div className="d-flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        disabled={inProgress || !photo.path}
        onClick={() => onReplace(photo)}
      >
        <i className={`bi ${Icons.arrowClockwise} me-1`} aria-hidden="true" />
        {Translator.t('staff_photos_page.replace')}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        disabled={inProgress}
        onClick={() => onDelete(photo)}
      >
        <i className={`bi ${Icons.trash} me-1`} aria-hidden="true" />
        {Translator.t('staff_photos_page.delete')}
      </button>
    </div>
  );
}
