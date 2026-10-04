/**
 * Date range presets accepted by the `range` URL param.
 *
 * @type {Array<string>}
 */
export const RANGES = ['7d', '30d', '90d', '12m', 'custom'];

/**
 * Granularity values accepted by the `granularity` URL param.
 *
 * @type {Array<string>}
 */
export const GRANULARITIES = ['auto', 'day', 'week', 'month'];

/**
 * Audience values accepted by the `audience` URL param.
 *
 * @type {Array<string>}
 */
export const AUDIENCES = ['all', 'anonymous', 'logged_in'];

/**
 * The `domain` value selecting sessions without a domain.
 *
 * @type {string}
 */
export const UNKNOWN_DOMAIN = 'unknown';

/**
 * Default value of every statistics filter (`null` means "any" / not set).
 *
 * @type {{range: string, from: null, to: null, granularity: string, user: null,
 *   domain: null, audience: string}}
 */
export const DEFAULTS = Object.freeze({
  range: '30d',
  from: null,
  to: null,
  granularity: 'auto',
  user: null,
  domain: null,
  audience: 'all',
});

const PRESET_OFFSET_DAYS = { '7d': 6, '30d': 29, '90d': 89 };
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ID_PATTERN = /^[0-9]{1,19}$/;
const MAX_ID = 9223372036854775807n;
const MIN_DATE = '1970-01-01';
const MAX_DATE = '9998-12-31';

/**
 * Pads a number to two digits.
 *
 * @param {number} value - Number to pad.
 * @returns {string} The padded number.
 */
function pad(value) {
  return String(value).padStart(2, '0');
}

/**
 * Parses a `YYYY-MM-DD` string into a UTC-midnight `Date`.
 *
 * @param {string} value - Date string.
 * @returns {Date} The parsed date (UTC midnight).
 */
function parseDate(value) {
  const [, year, month, day] = DATE_PATTERN.exec(value);
  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  return date;
}

/**
 * Formats a UTC-midnight `Date` as `YYYY-MM-DD`.
 *
 * @param {Date} date - Date to format.
 * @returns {string} The formatted date.
 */
function formatDate(date) {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  return `${year}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Subtracts one calendar year, clamping Feb 29 to Feb 28.
 *
 * @param {Date} date - UTC-midnight date.
 * @returns {Date} The date one year earlier.
 */
function minusOneYear(date) {
  const result = new Date(date.getTime());
  result.setUTCFullYear(date.getUTCFullYear() - 1);
  if (result.getUTCMonth() !== date.getUTCMonth()) result.setUTCDate(0);
  return result;
}

/**
 * URL filter state of the access statistics pages: defaults, validation and preset
 * resolution.
 */
export default class StatisticsFilters {
  /**
   * Reads the URL filters into a normalized filter object.
   *
   * @description Every invalid value falls back to its default: an unknown `range` or a
   *   `custom` range without a valid `from` / `to` pair (or with `from > to`) becomes `30d`;
   *   an unknown `granularity` becomes `auto`, an unknown `audience` becomes `all`, and a
   *   `user` / `domain` that is not a positive integer (nor `unknown` for `domain`) becomes
   *   "any" (`null`). `from` / `to` are only kept for `range=custom`.
   * @param {URLSearchParams} params - Filter params, e.g. from
   *   `HashRouteResolver#getFilterParams`.
   * @returns {{range: string, from: (string|null), to: (string|null), granularity: string,
   *   user: (string|null), domain: (string|null), audience: string}} The normalized filters.
   */
  static fromParams(params) {
    return {
      ...StatisticsFilters.#readRange(params.get('range'), params.get('from'), params.get('to')),
      granularity: StatisticsFilters.#oneOf(params.get('granularity'), GRANULARITIES, DEFAULTS.granularity),
      user: StatisticsFilters.#readId(params.get('user')),
      domain: params.get('domain') === UNKNOWN_DOMAIN
        ? UNKNOWN_DOMAIN
        : StatisticsFilters.#readId(params.get('domain')),
      audience: StatisticsFilters.#oneOf(params.get('audience'), AUDIENCES, DEFAULTS.audience),
    };
  }

  /**
   * Resolves the filters' range into a concrete date pair.
   *
   * @description Presets are relative to `today`: `7d` → today − 6 days, `30d` → today − 29,
   *   `90d` → today − 89, `12m` → (today − 1 year) + 1 day; `to` is always `today`. A
   *   `custom` range returns its own `from` / `to`.
   * @param {{range: string, from: (string|null), to: (string|null)}} filters - Normalized
   *   filters (see {@link StatisticsFilters.fromParams}).
   * @param {string} [today] - Today as `YYYY-MM-DD` (defaults to the browser's local date).
   * @returns {{from: string, to: string}} The inclusive date range.
   */
  static resolveDates(filters, today = StatisticsFilters.today()) {
    if (filters.range === 'custom') return { from: filters.from, to: filters.to };

    const end = parseDate(today);
    let start;

    if (filters.range === '12m') {
      start = minusOneYear(end);
      start.setUTCDate(start.getUTCDate() + 1);
    } else {
      start = new Date(end.getTime());
      start.setUTCDate(start.getUTCDate() - (PRESET_OFFSET_DAYS[filters.range] ?? PRESET_OFFSET_DAYS['30d']));
    }

    return { from: formatDate(start), to: today };
  }

  /**
   * Returns the local date in the browser's time zone.
   *
   * @description Built from the local date parts, never going through UTC, so late-evening
   *   dates don't shift to the next day.
   * @param {Date} [now] - Current instant (injectable for tests).
   * @returns {string} The local date as `YYYY-MM-DD`.
   */
  static today(now = new Date()) {
    const year = String(now.getFullYear()).padStart(4, '0');
    return `${year}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  /**
   * Checks whether a value is a valid `YYYY-MM-DD` date within the accepted window.
   *
   * @param {string|null|undefined} value - Value to check.
   * @returns {boolean} `true` when the value is a valid date.
   */
  static isValidDate(value) {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
    if (value < MIN_DATE || value > MAX_DATE) return false;

    return formatDate(parseDate(value)) === value;
  }

  /**
   * Reads the range, keeping `from` / `to` only for a valid custom range.
   *
   * @param {string|null} range - Raw `range` param.
   * @param {string|null} from - Raw `from` param.
   * @param {string|null} to - Raw `to` param.
   * @returns {{range: string, from: (string|null), to: (string|null)}} The range filters.
   */
  static #readRange(range, from, to) {
    if (range === 'custom' && StatisticsFilters.#isValidPair(from, to)) {
      return { range, from, to };
    }

    const preset = range === 'custom' ? DEFAULTS.range : StatisticsFilters.#oneOf(range, RANGES, DEFAULTS.range);
    return { range: preset, from: null, to: null };
  }

  /**
   * Checks a custom date pair.
   *
   * @param {string|null} from - Raw `from` param.
   * @param {string|null} to - Raw `to` param.
   * @returns {boolean} `true` when both dates are valid and `from <= to`.
   */
  static #isValidPair(from, to) {
    return StatisticsFilters.isValidDate(from) && StatisticsFilters.isValidDate(to) && from <= to;
  }

  /**
   * Returns `value` when allowed, otherwise `fallback`.
   *
   * @param {string|null} value - Raw value.
   * @param {Array<string>} allowed - Allowed values.
   * @param {string} fallback - Default value.
   * @returns {string} The accepted value.
   */
  static #oneOf(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }

  /**
   * Reads a positive integer id (at most `2**63 − 1`).
   *
   * @param {string|null} value - Raw value.
   * @returns {string|null} The canonical id, or `null` ("any") when invalid.
   */
  static #readId(value) {
    if (value === null || !ID_PATTERN.test(value)) return null;

    const id = BigInt(value);
    return id > 0n && id <= MAX_ID ? id.toString() : null;
  }
}
