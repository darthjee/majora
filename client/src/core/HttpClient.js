import { buildApiError } from './errors/buildApiError.js';
import { NetworkError } from './errors/NetworkError.js';
import { RetryPolicy } from './RetryPolicy.js';
import {
  appendQuery, attemptSignal, encodeBody, parseBody, requestPath as buildRequestPath,
} from './requestHelpers.js';

/**
 * `Retry-After` header of each 429 error, kept off the public error object.
 * @type {WeakMap<Error, string>}
 */
const retryAfterOf = new WeakMap();

/**
 * Default sleep between retries.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the delay.
 */
function defaultSleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Shared HTTP layer of the client.
 *
 * Paths are given **without** the `.json` suffix and relative to `baseUrl`
 * (e.g. `games/epic-quest/npcs/all`); every request targets `<baseUrl>/<path>.json`, unless
 * the `json: false` option is given, in which case it targets `<baseUrl>/<path>` (used by
 * routes outside the JSON API, such as the upload submit `uploads/image/<id>/submit`).
 * Every request carries `Authorization: Bearer <token>` and `Accept: application/json`.
 * Bodies are sent as JSON, or as `multipart/form-data` when a native `FormData` is given.
 *
 * Each attempt gets a fresh timeout (`timeout` option, else the configured one; `0`
 * disables it), combined with the caller's `signal`. Only `GET` requests are retried (see
 * `RetryPolicy`), up to `retries` times (option, else configured).
 *
 * Non-2xx responses raise the matching `ApiError` subclass; a rejected `fetch` raises
 * `NetworkError` (`timeout === true` when the client timeout fired). Errors never include
 * request headers (the token) or request bodies.
 */
export class HttpClient {
  #config;
  #sleep;
  #policy;

  /**
   * Builds the HTTP layer.
   * @param {import('./Config.js').Config} config - Resolved configuration.
   * @param {object} [internals] - Testing seams; not part of the public API.
   * @param {Function} [internals.sleep] - `(ms) => Promise` used between retries.
   * @param {Function} [internals.random] - Jitter source, returns a number in [0, 1).
   */
  constructor(config, { sleep = defaultSleep, random } = {}) {
    this.#config = config;
    this.#sleep = sleep;
    this.#policy = new RetryPolicy({ random });
  }

  /**
   * Sends a request, retrying it when allowed.
   * @param {string} method - HTTP method (`GET`, `POST`, `PATCH`, `DELETE`).
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {object} [options] - Request options.
   * @param {object} [options.query] - Query parameters (`undefined` / `null` skipped).
   * @param {unknown} [options.body] - JSON-serializable body or `FormData`.
   * @param {object} [options.headers] - Extra request headers.
   * @param {boolean} [options.json] - `false` targets `<baseUrl>/<path>` instead of
   *   `<baseUrl>/<path>.json` (default `true`).
   * @param {number} [options.timeout] - Timeout per attempt in ms (`0` disables).
   * @param {number} [options.retries] - Retries for a `GET` (`0` disables).
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The 2xx response.
   * @throws {import('./errors/ApiError.js').ApiError} On a non-2xx response.
   * @throws {NetworkError} When `fetch` rejects or times out.
   */
  async request(method, path, options = {}) {
    const verb = method.toUpperCase();
    const retries = options.retries ?? this.#config.retries;

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.#send(verb, path, options);
      } catch (error) {
        if (attempt >= retries || !this.#policy.shouldRetry(verb, error, options.signal)) {
          throw error;
        }
        await this.#sleep(this.#policy.delay(attempt, retryAfterOf.get(error)));
      }
    }
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
   * Sends a `POST` request (never retried).
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {unknown} body - JSON-serializable body or `FormData`.
   * @param {object} [options] - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  /**
   * Sends a `PATCH` request (never retried).
   * @param {string} path - Path relative to `baseUrl`, without `.json`.
   * @param {unknown} body - JSON-serializable body or `FormData`.
   * @param {object} [options] - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  /**
   * Sends a `DELETE` request (never retried).
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
   * @param {object} options - Request options (see `request`).
   * @returns {Promise<{status: number, headers: Headers, body: unknown}>} The response.
   */
  async #send(method, path, options) {
    const requestPath = buildRequestPath(path, options.json);
    const url = new URL(`${this.#config.baseUrl}${requestPath}`);
    const encoded = encodeBody(options.body);

    appendQuery(url, options.query);

    const { response, body } = await this.#fetch(method, requestPath, url, {
      method,
      headers: this.#headers(options.headers, encoded.headers),
      body: encoded.body,
    }, options);

    if (!response.ok) {
      const error = buildApiError({ status: response.status, method, path: requestPath, body });

      retryAfterOf.set(error, response.headers.get('retry-after'));
      throw error;
    }

    return { status: response.status, headers: response.headers, body };
  }

  /**
   * Calls `fetch` with the attempt's signal and reads the body, mapping any rejection to
   * a `NetworkError`.
   * @param {string} method - Upper-case HTTP method.
   * @param {string} requestPath - Request path, for the error message.
   * @param {URL} url - Full request URL.
   * @param {object} init - `fetch` init, without the signal.
   * @param {object} options - Request options (`timeout`, `signal`).
   * @returns {Promise<{response: Response, body: unknown}>} The response and parsed body.
   */
  async #fetch(method, requestPath, url, init, options) {
    const timeout = options.timeout ?? this.#config.timeout;
    const { signal, timeoutSignal } = attemptSignal(timeout, options.signal);

    try {
      const response = await this.#config.fetch(url.toString(), { ...init, signal });

      return { response, body: await parseBody(response) };
    } catch (cause) {
      throw this.#networkError(method, requestPath, cause, timeoutSignal, options.signal);
    }
  }

  /**
   * Builds the `NetworkError` of a rejected attempt.
   * @param {string} method - Upper-case HTTP method.
   * @param {string} requestPath - Request path.
   * @param {unknown} cause - The rejection reason.
   * @param {AbortSignal} [timeoutSignal] - The attempt's timeout signal.
   * @param {AbortSignal} [callerSignal] - The caller's signal.
   * @returns {NetworkError} The error.
   */
  #networkError(method, requestPath, cause, timeoutSignal, callerSignal) {
    const callerAborted = Boolean(callerSignal && callerSignal.aborted);

    if (timeoutSignal && timeoutSignal.aborted && !callerAborted) {
      return new NetworkError(`Timeout on ${method} ${requestPath}`, {
        cause: timeoutSignal.reason, timeout: true,
      });
    }

    const reason = callerAborted ? 'Request aborted' : 'Network error';

    return new NetworkError(`${reason} on ${method} ${requestPath}`, { cause });
  }

  /**
   * Builds the request headers; the Bearer header always wins.
   * @param {object} [extra] - Caller headers.
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
