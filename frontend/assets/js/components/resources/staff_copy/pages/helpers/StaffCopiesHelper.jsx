import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';

const PREFIX = 'staff_copies_page';

/**
 * Rendering helper for the staff copy page (issue #1571).
 */
export default class StaffCopiesHelper {
  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t(`${PREFIX}.loading`)} />;
  }

  /**
   * Render the load error state.
   *
   * @param {string} errorKey - i18n key of the error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(errorKey) {
    return <ErrorAlert error={Translator.t(errorKey)} />;
  }
}
