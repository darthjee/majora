import { ApiError } from './ApiError.js';

/**
 * Scope-related denial codes a 403 can carry.
 * @type {string[]}
 */
const PERMISSION_CODES = ['scope_missing', 'game_not_allowed', 'token_not_allowed'];

/**
 * Raised for a 403 response. `code` is `scope_missing`, `game_not_allowed` or
 * `token_not_allowed` for token denials, and `null` for a role denial.
 */
export class PermissionError extends ApiError {
  /**
   * Builds the error and picks the denial `code` from the extracted codes.
   * @param {object} response - The failed response (see `ApiError`).
   */
  constructor(response) {
    super(response);
    this.code = this.codes.find((code) => PERMISSION_CODES.includes(code)) || null;
  }
}
