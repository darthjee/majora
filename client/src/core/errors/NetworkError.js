import { MajoraError } from './MajoraError.js';

/**
 * Raised when `fetch` rejects: DNS failure, refused connection, abort or timeout.
 *
 * `cause` holds the original rejection reason; `timeout` is `true` when the request
 * was aborted by the client timeout.
 */
export class NetworkError extends MajoraError {
  /**
   * Builds the error.
   * @param {string} message - Human-readable description.
   * @param {{cause?: unknown, timeout?: boolean}} [options] - The rejection reason and
   *   whether the failure was a timeout.
   */
  constructor(message, { cause, timeout = false } = {}) {
    super(message, { cause });
    this.timeout = timeout;
  }
}
