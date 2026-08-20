import BaseClient from './BaseClient.js';

/**
 * HTTP client for public, unauthenticated domain-configuration requests.
 */
export default class DomainClient extends BaseClient {
  /**
   * Fetches the current domain group's configuration (favicon/title/sub-title
   * overrides), resolved server-side from the request's host.
   *
   * @returns {Promise<Response>} fetch response carrying `{favicon, title, sub_title}`.
   */
  config() {
    return this.getJson('/domain/config.json', null);
  }
}
