import BaseClient from './BaseClient.js';

/**
 * HTTP client for health-check requests.
 */
export default class HealthClient extends BaseClient {
  /**
   * Sends a GET request to the health-check endpoint.
   *
   * @description Polls the backend health endpoint to detect connectivity issues.
   * @returns {Promise<Response>} fetch response from the health endpoint.
   */
  check() {
    return this.request('/health.json', {
      headers: { Accept: 'application/json' },
    });
  }
}
