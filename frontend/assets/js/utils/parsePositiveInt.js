/**
 * Parse a positive integer from a raw string value, falling back to a
 * default when the value is missing, not a number, or below `1`.
 *
 * @param {string|null} value - Raw value to parse.
 * @param {number} fallback - Fallback value used when parsing fails.
 * @returns {number} The parsed positive integer, or `fallback`.
 */
export default function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}
