export const ASCENDING = 'asc';
export const DESCENDING = 'desc';

/**
 * Compares the "unknown" flag of two rows.
 *
 * @param {object} left - A row with an `unknown` flag.
 * @param {object} right - Another row with an `unknown` flag.
 * @returns {number} `1` when only `left` is unknown, `-1` when only `right` is, `0` otherwise.
 */
function compareUnknown(left, right) {
  return Number(Boolean(left.unknown)) - Number(Boolean(right.unknown));
}

/**
 * Compares the nullness of two values, `null` / `undefined` last.
 *
 * @param {*} left - A value.
 * @param {*} right - Another value.
 * @returns {number} `1` when only `left` is null, `-1` when only `right` is, `0` otherwise.
 */
function compareNull(left, right) {
  return Number(left === null || left === undefined) - Number(right === null || right === undefined);
}

/**
 * Compares two non-null values in ascending order.
 *
 * @param {string|number} left - A value.
 * @param {string|number} right - Another value.
 * @returns {number} Negative, zero or positive, as `Array#sort` expects.
 */
function compareValues(left, right) {
  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right);
  }

  return left - right;
}

/**
 * Builds the comparator for a column and direction.
 *
 * @param {string} key - The row key to sort by.
 * @param {string} direction - `asc` or `desc`.
 * @returns {Function} The `(left, right)` comparator.
 */
function comparator(key, direction) {
  const sign = direction === DESCENDING ? -1 : 1;

  return (left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];

    return compareUnknown(left, right)
      || compareNull(leftValue, rightValue)
      || sign * compareValues(leftValue, rightValue);
  };
}

/**
 * Sorts the Domains tab rows by a column (issue #1517).
 *
 * @description Pure: returns a new array. Without a `key` the API order is kept. The
 *   "unknown" row stays pinned last and `null` values (e.g. durations of rows without visits)
 *   sort after the other values, whatever the direction. Strings compare with
 *   `localeCompare`, numbers numerically; ties keep the API order (stable sort).
 * @param {object[]} rows - The mapped rows (see `DomainsController.map`).
 * @param {{key?: string, direction?: string}} [sort] - The column key and the direction
 *   (`asc`, the default, or `desc`).
 * @returns {object[]} The sorted rows.
 */
export default function sortDomains(rows, { key, direction = ASCENDING } = {}) {
  if (!key) {
    return [...rows];
  }

  return [...rows].sort(comparator(key, direction));
}
