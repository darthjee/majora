import BaseClient from '../../client/BaseClient.js';

const WRITERS = {
  POST: 'postJson',
  PATCH: 'patchJson',
  PUT: 'putJson',
};

/**
 * Thin HTTP client used by {@link RequestStore.mutate} to fire a non-`GET` request against an
 * already-resolved `resourceConfig` path, kept separate from {@link RequestClient} (`GET`-only)
 * the same way the per-resource clients (`CharacterClient`, etc.) are kept separate from
 * `RequestClient` — `RequestStore`'s mutation dispatch fetches an already-fully-built path
 * rather than assembling one from typed arguments.
 */
export default class RequestMutationClient extends BaseClient {
  /**
   * Fire a `POST`/`PATCH`/`PUT` request with a JSON body against an already-resolved path,
   * reusing {@link BaseClient}'s existing `postJson`/`patchJson`/`putJson` helpers.
   *
   * @param {string} method - HTTP method (`'POST'`, `'PATCH'`, or `'PUT'`).
   * @param {string} path - Request path, already fully built by a `resourceConfig` path builder.
   * @param {object} body - Fields to serialize as the JSON request body.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} The fetch response, unparsed — callers inspect `response.ok`/
   *   `response.status` and call `response.json()` themselves, the same way every other client
   *   in this codebase already does.
   */
  mutate(method, path, body, token) {
    const writer = WRITERS[method];

    if (!writer) {
      return Promise.reject(new Error(`RequestMutationClient: unsupported method '${method}'`));
    }

    return this[writer](path, token, body ?? {});
  }
}
