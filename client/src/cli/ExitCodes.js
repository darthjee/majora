import { ApiError } from '../core/errors/ApiError.js';
import { AuthenticationError } from '../core/errors/AuthenticationError.js';
import { ConfigurationError } from '../core/errors/ConfigurationError.js';
import { NetworkError } from '../core/errors/NetworkError.js';
import { NotFoundError } from '../core/errors/NotFoundError.js';
import { PermissionError } from '../core/errors/PermissionError.js';
import { ServerError } from '../core/errors/ServerError.js';
import { UsageError } from '../core/errors/UsageError.js';
import { ValidationError } from '../core/errors/ValidationError.js';

/**
 * Success.
 * @type {number}
 */
export const SUCCESS = 0;

/**
 * Unexpected / internal error.
 * @type {number}
 */
export const INTERNAL = 1;

/**
 * Usage error: bad arguments, `UsageError`, `ConfigurationError`, invalid `--data`.
 * @type {number}
 */
export const USAGE = 2;

/**
 * Interrupted (SIGINT).
 * @type {number}
 */
export const INTERRUPTED = 130;

/**
 * Error classes and their exit codes, most specific first (the `ApiError` subclasses come
 * before `ApiError` itself).
 * @type {Array<[Function, number]>}
 */
const MAPPING = [
  [UsageError, USAGE],
  [ConfigurationError, USAGE],
  [AuthenticationError, 3],
  [PermissionError, 4],
  [NotFoundError, 5],
  [ValidationError, 6],
  [ServerError, 8],
  [ApiError, 7],
  [NetworkError, 9],
];

/**
 * Every exit code with its cause, in order, for the help text.
 * @type {Array<[number, string]>}
 */
const DESCRIPTIONS = Object.freeze([
  [SUCCESS, 'Success'],
  [INTERNAL, 'Unexpected / internal error'],
  [USAGE, 'Usage error: bad arguments, UsageError, ConfigurationError, invalid --data'],
  [3, 'AuthenticationError (401)'],
  [4, 'PermissionError (403)'],
  [5, 'NotFoundError (404)'],
  [6, 'ValidationError (400)'],
  [7, 'Other ApiError (409, 422, ...)'],
  [8, 'ServerError (5xx)'],
  [9, 'NetworkError, including timeouts'],
  [INTERRUPTED, 'Interrupted (SIGINT)'],
]);

/**
 * Maps errors to the CLI exit codes. These codes are part of the public contract.
 */
export class ExitCodes {
  static SUCCESS = SUCCESS;
  static INTERNAL = INTERNAL;
  static USAGE = USAGE;
  static INTERRUPTED = INTERRUPTED;

  /**
   * The exit code of an error.
   * @param {unknown} error - Any thrown value.
   * @returns {number} The exit code (`1` for anything that is not a known `MajoraError`).
   */
  static for(error) {
    const match = MAPPING.find(([klass]) => error instanceof klass);

    return match ? match[1] : INTERNAL;
  }

  /**
   * Every exit code with its cause, for the help text.
   * @returns {Array<[number, string]>} The `[code, cause]` pairs.
   */
  static descriptions() {
    return DESCRIPTIONS.map(([code, cause]) => [code, cause]);
  }
}
