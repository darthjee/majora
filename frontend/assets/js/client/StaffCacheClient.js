import BaseClient from './BaseClient.js';

/**
 * HTTP client for staff-only cache management requests.
 */
export default class StaffCacheClient extends BaseClient {
  /**
   * Clears the entire server-side in-memory cache.
   *
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the staff cache endpoint.
   */
  clearCache(token) {
    return this.request('/staff/cache.json', {
      method: 'DELETE',
      headers: this.buildHeaders(token),
    });
  }
}
