import BaseClient from './BaseClient.js';

/**
 * HTTP client for the staff crawler debug endpoint (fetch).
 */
export default class CrawlerClient extends BaseClient {
  /**
   * Fetches a page of crawler emission records, oldest-first, optionally
   * starting after a given cursor.
   *
   * @param {number|string|null} [lastId] - Cursor id from a previous page's newest record;
   *   omitted (or nullish) to fetch from the start of the retained window.
   * @param {string|null} [token] - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the crawler debug endpoint.
   */
  fetchEmissions(lastId, token) {
    const query = this.buildQuery([['last_id', lastId]]).toString();

    return this.getJson(`/staff/crawler.json${query ? `?${query}` : ''}`, token);
  }
}
