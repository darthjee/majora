import StaffCopiesHelper from './helpers/StaffCopiesHelper.jsx';

/**
 * Render the staff-only game content copy page (issue #1571).
 *
 * @returns {React.ReactElement} Staff copy page.
 */
export default function StaffCopies() {
  return StaffCopiesHelper.renderLoading();
}
