/**
 * Reads an integer pagination header.
 * @param {Headers} headers - Response headers.
 * @param {string} name - Header name.
 * @returns {number|null} The value, or `null` when absent or not a number.
 */
function intHeader(headers, name) {
  const value = Number.parseInt(headers.get(name), 10);

  return Number.isNaN(value) ? null : value;
}

/**
 * One page of a list endpoint.
 *
 * `page`, `pages`, `perPage` and `total` come from the `page` / `pages` / `per_page` /
 * `total` response headers. A response without them (a non-paginated list such as
 * `my-games.json`) is a single page: `page = pages = 1`, `perPage = total = data.length`.
 */
export class Page {
  #fetchPage;

  /**
   * Builds a page.
   * @param {object} attributes - Page attributes.
   * @param {Array} attributes.data - The items of this page.
   * @param {number} attributes.page - This page's number (1-based).
   * @param {number} attributes.pages - Total number of pages.
   * @param {number} attributes.perPage - Page size.
   * @param {number} attributes.total - Total number of items.
   * @param {Function} [fetchPage] - `(pageNumber) => Promise<Page>`, used by `next()`.
   */
  constructor({ data, page, pages, perPage, total }, fetchPage) {
    this.data = data;
    this.page = page;
    this.pages = pages;
    this.perPage = perPage;
    this.total = total;
    this.#fetchPage = fetchPage;
  }

  /**
   * Builds a page from an `HttpClient` response.
   * @param {{headers: Headers, body: unknown}} response - The response.
   * @param {Function} [fetchPage] - `(pageNumber) => Promise<Page>`, used by `next()`.
   * @returns {Page} The page.
   */
  static fromResponse({ headers, body }, fetchPage) {
    const data = Array.isArray(body) ? body : [];
    const page = intHeader(headers, 'page') ?? 1;

    return new Page({
      data,
      page,
      pages: intHeader(headers, 'pages') ?? page,
      perPage: intHeader(headers, 'per_page') ?? data.length,
      total: intHeader(headers, 'total') ?? data.length,
    }, fetchPage);
  }

  /**
   * Whether a page follows this one.
   * @returns {boolean} `true` when `page < pages`.
   */
  get hasNext() {
    return this.page < this.pages;
  }

  /**
   * Fetches the next page, with the same options as this one.
   * @returns {Promise<Page|null>} The next page, or `null` on the last one.
   */
  async next() {
    if (!this.hasNext || !this.#fetchPage) {
      return null;
    }

    return this.#fetchPage(this.page + 1);
  }
}
