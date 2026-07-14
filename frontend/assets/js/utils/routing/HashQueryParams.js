/**
 * Helper for extracting query parameters from a hash string.
 */
export default class HashQueryParams {
  /**
   * Extract query parameters from a hash string.
   *
   * @param {string} hash - Hash value.
   * @returns {URLSearchParams} Query string parameters.
   */
  static parse(hash = '') {
    const query = String(hash).split('?')[1] ?? '';
    return new URLSearchParams(query);
  }
}
