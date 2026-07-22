/**
 * Shared fetch-mock helpers for Jasmine client specs.
 * Provides a fake `Response`-shaped object builder, a one-line `fetch` stub,
 * and a shared spec pair for the "sends the auth token when present" /
 * "omits the Authorization header when there is no token" contract that
 * client specs repeat for nearly every authenticated request.
 */

/**
 * Build a fake `Response`-shaped object for mocking `fetch` resolutions.
 *
 * @param {object} [body] - The JSON body the mocked response resolves to.
 * @param {object} [options] - Response options.
 * @param {boolean} [options.ok] - Whether the response is "ok".
 * @param {object} [options.headers] - Fake `Headers`-shaped object (only `.get(name)` is used
 *   by any current caller); defaults to one whose `.get` always resolves to `null`, matching a
 *   response with no pagination headers.
 * @returns {{ok: boolean, json: Function, headers: object}} A fake Response object exposing
 *   `ok`, `json()`, and `headers`.
 */
export function mockFetchJson(body = {}, { ok = true, headers = { get: () => null } } = {}) {
  return { ok, json: () => Promise.resolve(body), headers };
}

/**
 * Install a `spyOn(globalThis, 'fetch')` stub that resolves with a fake JSON response.
 *
 * @param {object} [body] - The JSON body the mocked response resolves to.
 * @param {object} [options] - Response options forwarded to {@link mockFetchJson}.
 * @returns {jasmine.Spy} The installed `fetch` spy, for specs that need to inspect calls
 *   or override the returned value for a specific test.
 */
export function stubFetchJson(body = {}, options = {}) {
  const fetchSpy = spyOn(globalThis, 'fetch');
  fetchSpy.and.returnValue(Promise.resolve(mockFetchJson(body, options)));
  return fetchSpy;
}

/**
 * Register the shared "sends the auth token when present" / "omits the
 * Authorization header when there is no token" pair of specs for a client call.
 *
 * @description Expects `globalThis.fetch` to already be spied on (e.g. via
 *   {@link stubFetchJson} in a `beforeEach`); asserts against `globalThis.fetch`
 *   directly rather than requiring callers to thread a spy reference through.
 * @param {object} config - Configuration for the shared pair.
 * @param {Function} config.call - Invokes the client call given a token, e.g.
 *   `(token) => client.fetchGame('demo', token)`.
 * @param {string} config.url - The expected request URL.
 * @param {string} [config.method] - The expected HTTP method.
 * @param {object} [config.headers] - Extra expected headers besides `Accept`/`Authorization`.
 * @param {*|Function} [config.body] - The expected request body, or a function of the
 *   token returning it, for the rare cases where the body itself depends on the token.
 * @param {string} [config.token] - The token value used for the "present" case.
 * @returns {void}
 */
export function itSendsAuthHeader({
  call,
  url,
  method = 'GET',
  headers = {},
  body,
  token = 'abc123',
}) {
  const resolveBody = (currentToken) => (typeof body === 'function' ? body(currentToken) : body);

  it('sends the auth token when present', async function() {
    await call(token);

    expect(globalThis.fetch).toHaveBeenCalledWith(url, jasmine.objectContaining({
      method,
      headers: { Accept: 'application/json', ...headers, Authorization: `Token ${token}` },
      body: resolveBody(token),
    }));
  });

  it('omits the Authorization header when there is no token', async function() {
    await call(null);

    expect(globalThis.fetch).toHaveBeenCalledWith(url, jasmine.objectContaining({
      method,
      headers: { Accept: 'application/json', ...headers },
      body: resolveBody(null),
    }));
  });
}
