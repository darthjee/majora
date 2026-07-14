import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/Icons.js';

/**
 * Rendering helper for the ResilienceIndicator element.
 */
export default class ResilienceIndicatorHelper {
  /**
   * Renders the resilience status icon matching the current status.
   *
   * @param {{status: ('idle'|'requesting'|'retrying')}} state - resilience indicator state.
   * @returns {React.ReactElement} resilience status icon.
   */
  static render(state) {
    if (state.status === 'requesting') {
      return ResilienceIndicatorHelper.#renderIcon(
        'text-warning', Icons.lightningChargeFill, Translator.t('header.resilience_requesting_alt')
      );
    }

    if (state.status === 'retrying') {
      return ResilienceIndicatorHelper.#renderIcon(
        'text-danger', Icons.hourglassSplit, Translator.t('header.resilience_retrying_alt')
      );
    }

    return ResilienceIndicatorHelper.#renderIcon(
      'text-success', Icons.lightningCharge, Translator.t('header.resilience_idle_alt')
    );
  }

  /**
   * Renders the resilience status `<i>` icon.
   *
   * @param {string} colorClass - Bootstrap text color utility class.
   * @param {string} icon - Bootstrap Icons class name.
   * @param {string} alt - alt/title text describing the status.
   * @returns {React.ReactElement} the icon element.
   */
  static #renderIcon(colorClass, icon, alt) {
    return (
      <i
        className={`bi ${icon} ${colorClass}`}
        aria-hidden="true"
        title={alt}
        data-testid="resilience-indicator"
      ></i>
    );
  }
}
