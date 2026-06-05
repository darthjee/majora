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
}
