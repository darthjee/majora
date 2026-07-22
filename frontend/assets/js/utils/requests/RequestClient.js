import BaseClient from '../../client/BaseClient.js';
import AuthStorage from '../auth/AuthStorage.js';
import parseJsonOrReject from '../http/parseJsonOrReject.js';
import parsePositiveInt from '../parsePositiveInt.js';

/**
 * Thin HTTP client used by {@link Request} to fetch a resolved
 * `resourceConfig` path, kept separate from the per-resource clients
 * (`GameClient`, `CharacterClient`, etc.) since `Request` fetches an
 * already-fully-built path rather than assembling one from typed arguments.
 */
export default class RequestClient extends BaseClient {
  /**
   * Fetch and parse a resource path as JSON, alongside its pagination metadata (mirroring
   * `GenericClient#fetchIndex`'s `page`/`pages`/`per_page` response-header contract) — every
   * response carries this metadata even for `single`-quantity-type paths that never actually
   * paginate, since it's cheap to read and callers that don't need it simply ignore the field.
   *
   * @param {string} path - Request path, already fully built by a `resourceConfig` path builder.
   * @param {object} [query] - Query params to append to `path` (e.g. pagination/filters),
   *   omitted entirely (no `?`) when empty.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<{data: object, pagination: {page: number, pages: number, perPage: number}}>}
   *   Resolves to the parsed JSON body and pagination metadata.
   */
  fetchResource(path, query = {}, signal) {
    const search = this.buildQuery(Object.entries(query)).toString();
    const url = search ? `${path}?${search}` : path;

    return this.getJson(url, AuthStorage.getToken(), {}, signal)
      .then((response) => parseJsonOrReject(response, `request failed: ${url}`)
        .then((data) => ({ data, pagination: this.#buildPagination(response) })));
  }

  /**
   * Build pagination metadata from a response's `page`/`pages`/`per_page` headers, defaulting
   * each to the same values `GenericClient#fetchIndex` defaults to when a header is missing.
   *
   * @param {Response} response - The fetch response to read headers from.
   * @returns {{page: number, pages: number, perPage: number}} Pagination metadata.
   */
  #buildPagination(response) {
    return {
      page: parsePositiveInt(response.headers.get('page'), 1),
      pages: parsePositiveInt(response.headers.get('pages'), 1),
      perPage: parsePositiveInt(response.headers.get('per_page'), 10),
    };
  }
}
