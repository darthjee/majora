import Router from '../../../../utils/routing/Router.js';

/**
 * Base controller with shared helpers for page controllers.
 */
export default class BasePageController {
  /**
   * Build a setter wrapper that only updates while mounted.
   *
   * @param {Function} isMounted - Function returning mounted status.
   * @returns {Function} Safe setter wrapper.
   */
  buildSafeSetter(isMounted) {
    return (setter, value) => {
      if (!isMounted()) {
        return;
      }

      setter(value);
    };
  }

  /**
   * Navigate to another hash route, guarding against non-browser environments.
   *
   * @param {string} hash - Destination hash (e.g. `/games/my-game`).
   * @returns {void}
   */
  redirectTo(hash) {
    if (typeof window !== 'undefined') {
      window.location.hash = hash;
    }
  }

  /**
   * Extract named params from a route pattern and hash, defaulting any
   * missing param to an empty string.
   *
   * @param {string} pattern - Route pattern (e.g. '/games/:game_slug').
   * @param {string} hash - Current hash.
   * @param {string[]} keys - Param names to extract.
   * @returns {object} Map of param name to string value.
   */
  static extractParams(pattern, hash, keys) {
    const params = Router.extractParams(pattern, hash);

    return keys.reduce((acc, key) => ({ ...acc, [key]: params[key] ?? '' }), {});
  }

  /**
   * Extract a single named param from a route pattern and hash.
   *
   * @param {string} pattern - Route pattern.
   * @param {string} key - Param name to extract.
   * @param {string} hash - Current hash.
   * @returns {string} Extracted value, or '' when absent.
   */
  static extractParam(pattern, key, hash) {
    return BasePageController.extractParams(pattern, hash, [key])[key];
  }
}
