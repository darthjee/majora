/**
 * Builds the request path relative to `baseUrl`: `games/x/npcs` → `/games/x/npcs.json`.
 * @param {string} path - Path without the `.json` suffix; leading slashes are ignored.
 * @returns {string} The request path.
 */
export function jsonPath(path) {
  return `${rawPath(path)}.json`;
}

/**
 * Builds the request path relative to `baseUrl` without any suffix:
 * `uploads/image/7/submit` → `/uploads/image/7/submit`.
 * @param {string} path - Path; leading slashes are ignored.
 * @returns {string} The request path.
 */
export function rawPath(path) {
  return `/${String(path).replace(/^\/+/, '')}`;
}

/**
 * Builds the request path, with the `.json` suffix unless `json` is `false`.
 * @param {string} path - Path without the `.json` suffix; leading slashes are ignored.
 * @param {boolean} [json] - Whether to append `.json` (default `true`).
 * @returns {string} The request path.
 */
export function requestPath(path, json = true) {
  return json === false ? rawPath(path) : jsonPath(path);
}

/**
 * Appends query parameters to a URL, skipping `undefined` and `null` values. Array values
 * are repeated (`a=1&a=2`).
 * @param {URL} url - The URL to modify.
 * @param {object} [query] - Query parameters.
 */
export function appendQuery(url, query) {
  Object.entries(query || {}).forEach(([key, value]) => {
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
export function encodeBody(body) {
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
export async function parseBody(response) {
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
 * Builds the abort signal of one attempt: a fresh `AbortSignal.timeout` (when
 * `timeout > 0`) combined with the caller's signal via `AbortSignal.any`.
 * @param {number} timeout - Timeout in ms; `0` disables it.
 * @param {AbortSignal} [signal] - Caller signal.
 * @returns {{signal: (AbortSignal|undefined), timeoutSignal: (AbortSignal|undefined)}} The
 *   combined signal and the timeout signal alone.
 */
export function attemptSignal(timeout, signal) {
  const timeoutSignal = timeout > 0 ? AbortSignal.timeout(timeout) : undefined;
  const signals = [timeoutSignal, signal].filter(Boolean);

  return {
    signal: signals.length > 1 ? AbortSignal.any(signals) : signals[0],
    timeoutSignal,
  };
}
