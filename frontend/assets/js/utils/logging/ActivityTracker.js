/**
 * Tracks the timestamp of the last user-initiated request.
 * Used to pause health-check polling during long idle periods.
 */
export default class ActivityTracker {
  static #lastActivity = null;

  /**
   * Records the current timestamp as the last activity time.
   *
   * @description Updates the internal timestamp to the current moment.
   * @returns {void}
   */
  static register() {
    ActivityTracker.#lastActivity = Date.now();
  }

  /**
   * Returns the timestamp (ms since epoch) of the last registered activity,
   * or null if no activity has been registered yet.
   *
   * @description Provides the last recorded activity time for idle detection.
   * @returns {number|null} Milliseconds since epoch of last activity, or null.
   */
  static getLastActivity() {
    return ActivityTracker.#lastActivity;
  }
}
