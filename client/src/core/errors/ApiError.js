import { MajoraError } from './MajoraError.js';
import { extractCodes } from './extractCodes.js';

/**
 * Raised for any non-2xx API response.
 *
 * Carries `status`, `method`, `path` (the request path, e.g. `/games/x/npcs.json`),
 * `body` (the parsed JSON, or the raw text when the response is not JSON) and `codes`
 * (every code found in the body). It never holds request headers (and so never the
 * token) nor the request body.
 *
 * Statuses with a dedicated meaning raise a subclass (`ValidationError`,
 * `AuthenticationError`, `PermissionError`, `NotFoundError`, `ServerError`); see
 * `buildApiError`.
 */
export class ApiError extends MajoraError {
  /**
   * Builds the error and its message, e.g.
   * `403 PermissionError on GET /games/x/npcs/all.json: scope_missing`.
   * @param {object} response - The failed response.
   * @param {number} response.status - HTTP status code.
   * @param {string} response.method - HTTP method of the request.
   * @param {string} response.path - Path of the request URL.
   * @param {unknown} [response.body] - Parsed response body or raw text.
   */
  constructor({ status, method, path, body = null }) {
    const codes = extractCodes(body);
    const suffix = codes.length ? `: ${codes.join(', ')}` : '';

    super(`${status} ${new.target.name} on ${method} ${path}${suffix}`);
    this.status = status;
    this.method = method;
    this.path = path;
    this.body = body;
    this.codes = codes;
  }
}
