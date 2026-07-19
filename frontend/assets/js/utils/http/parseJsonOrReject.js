/**
 * Parse a response body as JSON when the response is ok, otherwise reject
 * with an `Error` carrying the given message.
 *
 * @param {Response} response - The fetch response to parse.
 * @param {string} message - Error message used when the response is not ok.
 * @returns {Promise<object>} The parsed JSON body.
 */
export default function parseJsonOrReject(response, message) {
  return response.ok ? response.json() : Promise.reject(new Error(message));
}
