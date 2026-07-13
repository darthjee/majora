import BaseClient from './BaseClient.js';

/**
 * HTTP client for backend readiness-check requests.
 */
export default class ReadyClient extends BaseClient {
  /**
   * Sends a GET request to the readiness endpoint with a 5-second timeout.
   *
   * @description Polls the backend readiness endpoint to detect whether it
   *   is ready to serve requests. Aborts automatically after 5 seconds if
   *   no response is received.
   * @returns {Promise<Response>} fetch response from the readiness endpoint.
   */
  check() {
    const signal = AbortSignal.timeout(5000);

    return this.request('/ready.json', {
      headers: { Accept: 'application/json' },
      signal,
    });
  }
}
