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
   * `GenericClient#fetchIndex`'s `page`/`pages`/`per_page` response-header contract, plus `total`
   * — see {@link RequestClient#buildPagination}) — every response carries this metadata even for
   * `single`-quantity-type paths that never actually paginate, since it's cheap to read and
   * callers that don't need it simply ignore the field.
   *
   * @param {string} path - Request path, already fully built by a `resourceConfig` path builder.
   * @param {object} [query] - Query params to append to `path` (e.g. pagination/filters),
   *   omitted entirely (no `?`) when empty.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @param {boolean} [skipCache] - When `true`, forwards `X-Skip-Cache: true` (issue #842) —
   *   set from the resolved `resourceConfig` variant's own `skipCache` flag, for the rare `GET`
   *   whose identity-gated response cannot be expressed as a static
   *   `skipCacheSuffixes.js`/`skipCacheEndpoints.js` entry (e.g. `pollConfig.js`'s `GET.single`,
   *   whose dynamic trailing id rules out a suffix match).
   * @returns {Promise<{data: object, pagination: {page: number, pages: number, perPage: number,
   *   total: number}}>} Resolves to the parsed JSON body and pagination metadata.
   */
  fetchResource(path, query = {}, signal, skipCache = false) {
    const search = this.buildQuery(Object.entries(query)).toString();
    const url = search ? `${path}?${search}` : path;
    const extraHeaders = skipCache ? { 'X-Skip-Cache': 'true' } : {};

    return this.getJson(url, AuthStorage.getToken(), extraHeaders, signal)
      .then((response) => parseJsonOrReject(response, `request failed: ${url}`)
        .then((data) => ({ data, pagination: this.#buildPagination(response) })));
  }

  /**
   * Build pagination metadata from a response's `page`/`pages`/`per_page`/`total` headers,
   * defaulting each to the same values `GenericClient#fetchIndex` defaults to when a header is
   * missing (`total` defaults to `0`, matching `Paginator#_total`'s own zero-count case). `total`
   * (issue #842) is the one field `GenericClient#fetchIndex` doesn't already expose — needed by
   * `OpenPollsWidgetController`, whose `pages` value alone is ambiguous at zero results
   * (`Paginator#_pages` floors at `1` even when `total` is `0`).
   *
   * @param {Response} response - The fetch response to read headers from.
   * @returns {{page: number, pages: number, perPage: number, total: number}} Pagination metadata.
   */
  #buildPagination(response) {
    return {
      page: parsePositiveInt(response.headers.get('page'), 1),
      pages: parsePositiveInt(response.headers.get('pages'), 1),
      perPage: parsePositiveInt(response.headers.get('per_page'), 10),
      total: parsePositiveInt(response.headers.get('total'), 0),
    };
  }
}
