const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pad a number to two digits.
 *
 * @param {number} number - The number to pad.
 * @returns {string} The zero-padded string.
 */
const pad = (number) => String(number).padStart(2, '0');

/**
 * Pure expiry conversion of the create API token form (issue #1605).
 *
 * @description Presets are computed at submit time from the browser clock; a custom date
 *   expires at the end of the chosen day in the browser's time zone; every value is sent as
 *   a UTC ISO string, or `null` for "Never".
 */
export default class ApiTokenExpiry {
  /**
   * The expiry choices, in display order.
   *
   * @returns {Array<string>} `['30', '90', 'custom', 'never']`.
   */
  static get CHOICES() {
    return ['30', '90', 'custom', 'never'];
  }

  /**
   * The default expiry state (90 days).
   *
   * @returns {{choice: string, customDate: string}} The default state.
   */
  static get DEFAULT() {
    return { choice: '90', customDate: '' };
  }

  /**
   * Whether an expiry state is complete enough to be submitted.
   *
   * @param {{choice: string, customDate: string}} expiry - The expiry state.
   * @returns {boolean} `false` only when `'custom'` is chosen without a date.
   */
  static isComplete({ choice, customDate }) {
    return choice !== 'custom' || Boolean(customDate);
  }

  /**
   * Convert an expiry choice to the `expires_at` value sent to the API.
   *
   * @param {{choice: string, customDate: string}} expiry - The choice (`'30'`, `'90'`,
   *   `'custom'` or `'never'`) and, for `'custom'`, the `YYYY-MM-DD` date.
   * @param {Date} [now] - The current time.
   * @returns {string|null} The UTC ISO string, or `null` for no expiry ("Never" only).
   * @throws {Error} When `'custom'` is chosen without a date, so an incomplete custom expiry is
   *   never silently sent as "Never".
   */
  static toExpiresAt({ choice, customDate }, now = new Date()) {
    if (choice === 'never') return null;
    if (choice === 'custom') return ApiTokenExpiry.#endOfDay(customDate);

    return new Date(now.getTime() + Number(choice) * DAY_MS).toISOString();
  }

  /**
   * Tomorrow's date in local time, the earliest custom date allowed.
   *
   * @param {Date} [now] - The current time.
   * @returns {string} Tomorrow as `YYYY-MM-DD`.
   */
  static minDate(now = new Date()) {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  }

  /**
   * The end (23:59:59.999) of a `YYYY-MM-DD` day in local time, as a UTC ISO string.
   *
   * @param {string} date - The `YYYY-MM-DD` date.
   * @returns {string} The ISO string.
   * @throws {Error} When no date is given.
   */
  static #endOfDay(date) {
    if (!date) throw new Error('A custom expiry requires a date');

    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
  }
}
