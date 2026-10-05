const EMPTY = '—';
const DATE_TIME_OPTIONS = Object.freeze({ dateStyle: 'medium', timeStyle: 'short' });

/**
 * Pure formatter for the access statistics timestamps (issues #1520 and #1523).
 *
 * @description Formats an ISO 8601 timestamp as a medium date and a short time in the
 *   browser's zone and locale. A missing value renders as `—`.
 */
export default class StatisticsDateTimeFormatter {
  /**
   * Formats an ISO timestamp as a date and time.
   *
   * @param {?string} value - ISO 8601 timestamp.
   * @returns {string} The formatted date and time, or a dash when missing.
   */
  static format(value) {
    if (!value) return EMPTY;

    return new Intl.DateTimeFormat(undefined, DATE_TIME_OPTIONS).format(new Date(value));
  }
}
