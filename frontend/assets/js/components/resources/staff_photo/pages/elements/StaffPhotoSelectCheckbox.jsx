import Translator from '../../../../../i18n/Translator.js';

/**
 * Selection checkbox of a staff photo row.
 *
 * @param {object} props - Component props.
 * @param {{id: number}} props.photo - The photo row.
 * @param {boolean} props.checked - Whether the photo is selected.
 * @param {boolean} props.disabled - Whether the checkbox is disabled (bulk job running).
 * @param {Function} props.onToggle - Called with the photo when toggled.
 * @returns {React.ReactElement} Checkbox input.
 */
export default function StaffPhotoSelectCheckbox({
  photo, checked, disabled, onToggle,
}) {
  return (
    <input
      type="checkbox"
      className="form-check-input"
      aria-label={Translator.t('staff_photos_page.select_photo')}
      checked={checked}
      disabled={disabled}
      onChange={() => onToggle(photo)}
    />
  );
}
