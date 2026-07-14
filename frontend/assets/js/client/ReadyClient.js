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
   *   no response is received. Explicitly opts out of `BaseClient`'s automatic
   *   retry-on-502/timeout behavior: callers (e.g. `RecoverPasswordController`)
   *   wrap each single attempt in their own `ResilientRequest` at the controller
   *   level instead.
   * @returns {Promise<Response>} fetch response from the readiness endpoint.
   */
  check() {
    const signal = AbortSignal.timeout(5000);

    return this.request('/ready.json', {
      headers: { Accept: 'application/json' },
      signal,
      retry: false,
    });
  }
}
