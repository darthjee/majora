import HttpResponseError from './HttpResponseError.js';

/**
 * Reads a response body as JSON, resolving to `null` when it can't be parsed.
 *
 * @param {Response} response - The fetch response to read.
 * @returns {Promise<?object>} The parsed body, or `null`.
 */
function readBody(response) {
  if (typeof response.json !== 'function') {
    return Promise.resolve(null);
  }

  return Promise.resolve()
    .then(() => response.json())
    .catch(() => null);
}

/**
 * Parse a response body as JSON when the response is ok, otherwise reject
 * with an `HttpResponseError` carrying the given message, the status and the
 * parsed body (or `null` when the body isn't JSON).
 *
 * @param {Response} response - The fetch response to parse.
 * @param {string} message - Error message used when the response is not ok.
 * @returns {Promise<object>} The parsed JSON body.
 */
export default function parseJsonOrReject(response, message) {
  if (response.ok) {
    return response.json();
  }

  return readBody(response).then((body) => {
    throw new HttpResponseError(message, response.status, body);
  });
}
