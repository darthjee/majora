import BaseClient from './BaseClient.js';

/**
 * HTTP client for health-check requests.
 */
export default class HealthClient extends BaseClient {
  /**
   * Sends a GET request to the health-check endpoint with a 5-second timeout.
   *
   * @description Polls the backend health endpoint to detect connectivity issues.
   *   Aborts automatically after 5 seconds if no response is received.
   * @returns {Promise<Response>} fetch response from the health endpoint.
   */
  check() {
    const signal = AbortSignal.timeout(5000);

    return this.request('/health.json', {
      headers: { Accept: 'application/json' },
      signal,
    });
  }
}
