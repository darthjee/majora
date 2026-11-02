/**
 * Error raised when an HTTP request answers with a non-ok status. It keeps
 * the response status and its parsed JSON body (or `null`) so consumers can
 * react to specific backend error codes.
 */
export default class HttpResponseError extends Error {
  /**
   * Builds the error.
   *
   * @description Stores the status and body alongside the error message.
   * @param {string} message - Human readable error message.
   * @param {number} status - HTTP status code of the response.
   * @param {?object} body - Parsed JSON body, or `null` when not JSON.
   */
  constructor(message, status, body = null) {
    super(message);
    this.name = 'HttpResponseError';
    this.status = status;
    this.body = body;
  }

  /**
   * Lists the error codes found in `body.errors.detail`.
   *
   * @description Reads the backend error codes, ignoring malformed bodies.
   * @returns {Array<string>} The error codes, or an empty array.
   */
  errorCodes() {
    const detail = this.body?.errors?.detail;

    return Array.isArray(detail) ? detail : [];
  }

  /**
   * Tells whether the body carries the given error code.
   *
   * @description Checks `body.errors.detail` for the given code.
   * @param {string} code - The error code to look for.
   * @returns {boolean} True when the code is present.
   */
  hasErrorCode(code) {
    return this.errorCodes().includes(code);
  }
}
