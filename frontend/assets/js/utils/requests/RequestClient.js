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
   * @param {object} [query] - Query params to append to `path` (e.g. pagination/filters),
   *   omitted entirely (no `?`) when empty.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<object>} Resolves to the parsed JSON body.
   */
  fetchResource(path, query = {}, signal) {
    const search = this.buildQuery(Object.entries(query)).toString();
    const url = search ? `${path}?${search}` : path;

    return this.getJson(url, AuthStorage.getToken(), {}, signal)
      .then((response) => parseJsonOrReject(response, `request failed: ${url}`));
  }
}
