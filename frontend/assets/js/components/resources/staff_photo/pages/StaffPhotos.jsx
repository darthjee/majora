import LoadingMessage from '../../../common/misc/LoadingMessage.jsx';
import Translator from '../../../../i18n/Translator.js';

/**
 * Render the staff photos page (placeholder, fleshed out in a later step).
 *
 * @returns {React.ReactElement} Staff photos page.
 */
export default function StaffPhotos() {
  return <LoadingMessage message={Translator.t('staff_photos_page.loading')} />;
}
