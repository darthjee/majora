import { Page } from './Page.js';

/**
 * Reads list endpoints page by page, following the API pagination contract
 * (`page` / `per_page` query parameters, `page` / `pages` / `per_page` / `total` headers).
 *
 * There is no client-side default page size: `perPage` is sent only when given, so the
 * server default applies otherwise. Filters go in `query`; they cannot override `page` or
 * `per_page`.
 *
 * Pagination is offset-based: items created or deleted while iterating can be skipped or
 * repeated. This is a known limitation of the API, not worked around here.
 */
export class Paginator {
  #http;

  /**
   * Builds the paginator.
   * @param {import('./HttpClient.js').HttpClient} http - The HTTP layer.
   */
  constructor(http) {
    this.#http = http;
  }

  /**
   * Fetches one page.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} [options] - List options.
   * @param {number} [options.page] - Page number (1-based); server default when omitted.
   * @param {number} [options.perPage] - Page size; server default when omitted.
   * @param {object} [options.query] - Filters, sent as query parameters.
   * @param {object} [options.headers] - Extra request headers.
   * @param {number} [options.timeout] - Timeout per attempt in ms.
   * @param {number} [options.retries] - Retries for this page fetch.
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<Page>} The page; `page.next()` fetches the following one.
   */
  async list(path, options = {}) {
    const { page, perPage, query, headers, timeout, retries, signal } = options;
    const response = await this.#http.get(path, {
      query: { ...query, page, per_page: perPage },
      headers,
      timeout,
      retries,
      signal,
    });

    return Page.fromResponse(response, (number) => this.list(path, { ...options, page: number }));
  }

  /**
   * Iterates over the items of every page, fetching one page at a time on demand and
   * stopping at the last page (or an empty one). Each page fetch is retried on its own,
   * so a failure on page 5 does not restart from page 1.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} [options] - List options (see `list`); `page` sets the first page.
   * @yields {unknown} Each item, in order.
   * @returns {AsyncGenerator<unknown>} The items.
   */
  async *iterate(path, options = {}) {
    let current = await this.list(path, options);

    for (;;) {
      yield* current.data;

      if (current.data.length === 0 || !current.hasNext) {
        return;
      }
      current = await current.next();
    }
  }
}
