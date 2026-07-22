import BaseClient from '../../client/BaseClient.js';
import AuthStorage from '../auth/AuthStorage.js';
import parseJsonOrReject from '../http/parseJsonOrReject.js';

/**
 * Thin HTTP client used by {@link Request} to fetch a resolved
 * `resourceConfig` path, kept separate from the per-resource clients
 * (`GameClient`, `CharacterClient`, etc.) since `Request` fetches an
 * already-fully-built path rather than assembling one from typed arguments.
 */
export default class RequestClient extends BaseClient {
  /**
   * Fetch and parse a resource path as JSON.
   *
   * @param {string} path - Request path, already fully built by a `resourceConfig` path builder.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<object>} Resolves to the parsed JSON body.
   */
  fetchResource(path, signal) {
    return this.getJson(path, AuthStorage.getToken(), {}, signal)
      .then((response) => parseJsonOrReject(response, `request failed: ${path}`));
  }
}
