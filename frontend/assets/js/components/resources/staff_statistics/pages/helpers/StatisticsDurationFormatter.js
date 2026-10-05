const EMPTY = '—';
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

/**
 * Pure formatter for the access statistics durations.
 *
 * @description Formats a number of seconds as `Xm Ys` below one hour and as `Xh Ym` from one
 *   hour on (seconds are dropped in the hour form). A missing value (`null` / `undefined`,
 *   e.g. the average duration of an empty range) renders as `—`. The result is not
 *   translated.
 */
export default class StatisticsDurationFormatter {
  /**
   * Formats a duration in seconds.
   *
   * @description `0` → `0m 0s`, `274` → `4m 34s`, `3600` → `1h 0m`, `5430` → `1h 30m`,
   *   `null` → `—`.
   * @param {?number} seconds - The duration in whole seconds, or `null` when unknown.
   * @returns {string} The formatted duration.
   */
  static format(seconds) {
    if (seconds === null || seconds === undefined) return EMPTY;

    if (seconds < SECONDS_PER_HOUR) {
      const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
      return `${minutes}m ${seconds % SECONDS_PER_MINUTE}s`;
    }

    const hours = Math.floor(seconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    return `${hours}h ${minutes}m`;
  }
}
