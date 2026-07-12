import BaseClient from './BaseClient.js';

/**
 * HTTP client for the backend's page-to-resource-kind config endpoint,
 * consumed by {@link AccessRouteConfigStore}.
 */
export default class AccessRouteConfigClient extends BaseClient {
  /**
   * Fetches the resource-kind config used to resolve each page's access checks.
   *
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} fetch response from the access-route-config endpoint.
   */
  fetchAccessRouteConfig(signal) {
    return this.getJson('/access-route-config.json', null, {}, signal);
  }
}
