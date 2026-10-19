import { ApiError } from './ApiError.js';
import { AuthenticationError } from './AuthenticationError.js';
import { NotFoundError } from './NotFoundError.js';
import { PermissionError } from './PermissionError.js';
import { ServerError } from './ServerError.js';
import { ValidationError } from './ValidationError.js';

/**
 * Error class for each status with a dedicated subclass.
 * @type {Object<number, typeof ApiError>}
 */
const CLASSES_BY_STATUS = {
  400: ValidationError,
  401: AuthenticationError,
  403: PermissionError,
  404: NotFoundError,
};

/**
 * Picks the `ApiError` subclass matching a status.
 * @param {number} status - HTTP status code.
 * @returns {typeof ApiError} The subclass, or `ApiError` itself for other statuses.
 */
function classFor(status) {
  if (status >= 500 && status < 600) {
    return ServerError;
  }

  return CLASSES_BY_STATUS[status] || ApiError;
}

/**
 * Builds the typed error for a non-2xx response.
 * @param {object} response - The failed response.
 * @param {number} response.status - HTTP status code.
 * @param {string} response.method - HTTP method of the request.
 * @param {string} response.path - Path of the request URL.
 * @param {unknown} [response.body] - Parsed response body or raw text.
 * @returns {ApiError} An instance of the matching subclass.
 */
export function buildApiError(response) {
  const ErrorClass = classFor(response.status);

  return new ErrorClass(response);
}
