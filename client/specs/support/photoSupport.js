import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { Paginator } from '../../src/core/Paginator.js';
import { FetchStub } from './FetchStub.js';
import { BASE_URL, buildCore } from './buildCore.js';

export const TOKEN = 'mjr_fake_token_for_specs';

/**
 * Builds the wrapper on a fresh `FetchStub`.
 * @param {Function} build - `(http, paginator) => resource`.
 * @returns {{stub: FetchStub, resource: object}} The stub and the wrapper.
 */
export function setup(build) {
  const stub = new FetchStub();
  const { http, paginator } = buildCore(stub);

  return { stub, resource: build(http, paginator) };
}

/**
 * Builds the wrapper on a `FetchStub` with 3 configured retries and an instant sleep, so a
 * retried request would show up as an extra call.
 * @param {Function} build - `(http, paginator) => resource`.
 * @param {FetchStub} stub - The fetch stub.
 * @returns {object} The wrapper.
 */
export function buildRetrying(build, stub) {
  const config = new Config({
    baseUrl: BASE_URL, token: TOKEN, fetch: stub.fetch, retries: 3, env: {},
  });
  const http = new HttpClient(config, { sleep: () => Promise.resolve() });

  return build(http, new Paginator(http));
}
