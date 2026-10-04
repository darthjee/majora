const LABEL_OPTIONS = {
  day: { day: 'numeric', month: 'short' },
  week: { day: 'numeric', month: 'short' },
  month: { month: 'short', year: 'numeric' },
};
const FULL_DATE_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric' };

/**
 * Parses a `YYYY-MM-DD` string as UTC midnight.
 *
 * @param {string} value - The date as `YYYY-MM-DD`.
 * @returns {Date} The parsed date.
 */
function parseDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

/**
 * Formats a `YYYY-MM-DD` string with the given options, always in UTC.
 *
 * @param {string} value - The date as `YYYY-MM-DD`.
 * @param {object} options - `Intl.DateTimeFormat` options.
 * @param {string} [locale] - Locale (defaults to the browser locale).
 * @returns {string} The formatted date.
 */
function formatDate(value, options, locale) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(parseDate(value));
}

/**
 * Pure formatting helpers for the access statistics time-series buckets.
 *
 * @description Shared by the time-series tabs (Visits, Visitors, Duration). Bucket dates are
 *   `YYYY-MM-DD` strings parsed as UTC midnight and formatted with `timeZone: 'UTC'`, so the
 *   displayed date never shifts by a day. Every method takes an optional `locale` (defaults
 *   to the browser locale).
 */
export default class StatisticsBucketFormatter {
  /**
   * Builds the X-axis label of a bucket.
   *
   * @description `day` and `week` buckets show day and month (a week is labeled by its
   *   clipped start); `month` buckets show month and year.
   * @param {string} start - The bucket's start as `YYYY-MM-DD`.
   * @param {string} granularity - The resolved granularity (`day`, `week` or `month`).
   * @param {string} [locale] - Locale (defaults to the browser locale).
   * @returns {string} The axis label (e.g. `5 Jan` or `Jan 2026`).
   */
  static label(start, granularity, locale = undefined) {
    return formatDate(start, LABEL_OPTIONS[granularity] || LABEL_OPTIONS.day, locale);
  }

  /**
   * Builds the tooltip's date range of a bucket.
   *
   * @description A single full date when `start === end`, otherwise `"<start> – <end>"`
   *   with both ends as full dates.
   * @param {string} start - The bucket's start as `YYYY-MM-DD`.
   * @param {string} end - The bucket's inclusive end as `YYYY-MM-DD`.
   * @param {string} [locale] - Locale (defaults to the browser locale).
   * @returns {string} The formatted range.
   */
  static range(start, end, locale = undefined) {
    const first = formatDate(start, FULL_DATE_OPTIONS, locale);
    if (start === end) return first;

    return `${first} – ${formatDate(end, FULL_DATE_OPTIONS, locale)}`;
  }

  /**
   * Formats an integer count.
   *
   * @param {number} value - The count.
   * @param {string} [locale] - Locale (defaults to the browser locale).
   * @returns {string} The formatted count (e.g. `1,234`).
   */
  static count(value, locale = undefined) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  }

  /**
   * Formats a 0..1 share as a whole-number percentage.
   *
   * @param {number} share - The share between 0 and 1.
   * @param {string} [locale] - Locale (defaults to the browser locale).
   * @returns {string} The formatted percentage (e.g. `43%`).
   */
  static percent(share, locale = undefined) {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(share);
  }
}
