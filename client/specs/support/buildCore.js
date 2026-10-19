import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { Paginator } from '../../src/core/Paginator.js';

export const BASE_URL = 'https://majora.example.com';

/**
 * Builds the HTTP layer and the paginator on top of a `FetchStub`, with retries disabled.
 * @param {import('./FetchStub.js').FetchStub} stub - The fetch stub.
 * @returns {{http: HttpClient, paginator: Paginator}} The core objects.
 */
export function buildCore(stub) {
  const config = new Config({
    baseUrl: BASE_URL, token: 'mjr_fake_token_for_specs', fetch: stub.fetch, retries: 0, env: {},
  });
  const http = new HttpClient(config);

  return { http, paginator: new Paginator(http) };
}

/**
 * Pagination headers for a stubbed list response.
 * @param {number} page - Page number.
 * @param {number} pages - Total pages.
 * @param {number} [perPage] - Page size.
 * @param {number} [total] - Total items.
 * @returns {object} The headers.
 */
export function pageHeaders(page, pages, perPage = 2, total = 4) {
  return { page: String(page), pages: String(pages), per_page: String(perPage), total: String(total) };
}

/**
 * Collects every item of an async iterable.
 * @param {AsyncIterable<unknown>} iterable - The iterable.
 * @returns {Promise<Array>} The items.
 */
export async function collect(iterable) {
  const items = [];

  for await (const item of iterable) {
    items.push(item);
  }

  return items;
}
