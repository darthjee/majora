/**
 * Utility providing a shared no-op function, to be used instead of
 * inline `() => {}` literals wherever a placeholder callback is needed.
 */
export default class Noop {
  /**
   * A function that does nothing.
   *
   * @returns {void}
   */
  // eslint-disable-next-line no-empty-function
  static noop() {}
}
