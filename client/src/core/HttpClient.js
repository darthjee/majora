import { buildApiError } from './errors/buildApiError.js';
import { NetworkError } from './errors/NetworkError.js';

/**
 * Builds the request path relative to `baseUrl`: `games/x/npcs` → `/games/x/npcs.json`.
 * @param {string} path - Path without the `.json` suffix; leading slashes are ignored.
 * @returns {string} The request path.
 */
function jsonPath(path) {
  return `/${String(path).replace(/^\/+/, '')}.json`;
}

/**
 * Appends query parameters to a URL, skipping `undefined` and `null` values. Array values
 * are repeated (`a=1&a=2`).
 * @param {URL} url - The URL to modify.
 * @param {object} [query] - Query parameters.
 */
function appendQuery(url, query = {}) {
  Object.entries(query).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values
      .filter((item) => item !== undefined && item !== null)
      .forEach((item) => url.searchParams.append(key, String(item)));
  });
}

/**
 * Encodes a request body. `FormData` is passed as is so `fetch` sets the multipart
 * boundary; anything else is sent as JSON.
 * @param {unknown} body - The request body, or `undefined` for none.
 * @returns {{body: (string|FormData|undefined), headers: object}} The encoded body and the
 *   headers it needs.
 */
function encodeBody(body) {
  if (body === undefined) {
    return { body: undefined, headers: {} };
  }
  if (body instanceof FormData) {
    return { body, headers: {} };
  }

  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
}

/**
 * Reads a response body: parsed JSON when it parses, the raw text otherwise, `null` when
 * empty. An HTML error page therefore never breaks parsing.
 * @param {Response} response - The fetch response.
 * @returns {Promise<unknown>} The parsed body.
 */
async function parseBody(response) {
  const text = await response.text();

  if (text === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Shared HTTP layer of the client.
 *
 * Paths are given **without** the `.json` suffix and relative to `baseUrl`
 * (e.g. `games/epic-quest/npcs/all`); every request targets `<baseUrl>/<path>.json`.
 * Every request carries `Authorization: Bearer <token>` and `Accept: application/json`.
 * Bodies are sent as JSON, or as `multipart/form-data` when a native `FormData` is given.
 * Non-2xx responses raise the matching `ApiError` subclass; a rejected `fetch` raises
 * `NetworkError`. Errors never include request headers (the token) or request bodies.
 */
export class HttpClient {
  #config;

  /**
   * Builds the HTTP layer.
   * @param {import('./Config.js').Config} config - Resolved configuration.
   */
  constructor(config) {
    this.#config = config;
  }

  /**
   * Sends a request.
   * @param {string} method - HTTP method (`GET`, `POST`, `PATCH`, `DELETE`).
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} [options] - Request options.
   * @param {object} [options.query] - Query parameters (`undefined` / `null` skipped).
   * @param {unknown} [options.body] - JSON-serializable body or `FormData`.
   * @param {object} [options.headers] - Extra request headers.
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The 2xx response.
   * @throws {import('./errors/ApiError.js').ApiError} On a non-2xx response.
   * @throws {NetworkError} When `fetch` rejects.
   */
  async request(method, path, options = {}) {
    return this.#send(method.toUpperCase(), path, options);
  }

  /**
   * Sends a `GET` request.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} [options] - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  get(path, options = {}) {
    return this.request('GET', path, options);
  }

  /**
   * Sends a `POST` request.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {unknown} body - JSON-serializable body or `FormData`.
   * @param {object} [options] - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  /**
   * Sends a `PATCH` request.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {unknown} body - JSON-serializable body or `FormData`.
   * @param {object} [options] - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  /**
   * Sends a `DELETE` request.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} [options] - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  /**
   * Sends one attempt of a request.
   * @param {string} method - Upper-case HTTP method.
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} options - Request options.
   * @param {object} [options.query] - Query parameters.
   * @param {unknown} [options.body] - Request body.
   * @param {object} [options.headers] - Extra request headers.
   * @param {AbortSignal} [options.signal] - Abort signal.
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  async #send(method, path, { query, body, headers = {}, signal } = {}) {
    const requestPath = jsonPath(path);
    const url = new URL(`${this.#config.baseUrl}${requestPath}`);
    const encoded = encodeBody(body);

    appendQuery(url, query);

    let response;
    let responseBody;

    try {
      response = await this.#config.fetch(url.toString(), {
        method,
        headers: this.#headers(headers, encoded.headers),
        body: encoded.body,
        signal,
      });
      responseBody = await parseBody(response);
    } catch (cause) {
      throw new NetworkError(`Network error on ${method} ${requestPath}`, { cause });
    }

    if (!response.ok) {
      throw buildApiError({ status: response.status, method, path: requestPath, body: responseBody });
    }

    return { status: response.status, headers: response.headers, body: responseBody };
  }

  /**
   * Builds the request headers; the Bearer header always wins.
   * @param {object} extra - Caller headers.
   * @param {object} bodyHeaders - Headers required by the body encoding.
   * @returns {object} The headers.
   */
  #headers(extra, bodyHeaders) {
    return {
      Accept: 'application/json',
      ...extra,
      ...bodyHeaders,
      Authorization: `Bearer ${this.#config.token}`,
    };
  }
}
