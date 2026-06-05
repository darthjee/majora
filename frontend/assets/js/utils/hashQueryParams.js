/**
 * Extract query parameters from a hash string.
 *
 * @param {string} hash - Hash value.
 * @returns {URLSearchParams} Query string parameters.
 */
export default function hashQueryParams(hash = '') {
  const query = String(hash).split('?')[1] ?? '';
  return new URLSearchParams(query);
}
