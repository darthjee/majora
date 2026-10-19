import { ApiError } from './errors/ApiError.js';
import { NetworkError } from './errors/NetworkError.js';

/**
 * Statuses worth retrying: throttling and proxy errors during a deploy or restart.
 * @type {number[]}
 */
const RETRY_STATUSES = [429, 502, 503, 504];

/**
 * Default backoff base delay, in milliseconds.
 * @type {number}
 */
export const BASE_DELAY = 500;

/**
 * Decides which failed requests are retried and how long to wait before each retry.
 *
 * Only `GET` is retried, on a `NetworkError` (unless the caller aborted the request) or
 * a 429 / 502 / 503 / 504. Writes and other statuses (other 4xx, 500) never are. The
 * delay grows exponentially with jitter (about 0.5 s, then 1 s, ...); a 429 with a
 * `Retry-After` header waits as long as the header says.
 */
export class RetryPolicy {
  #baseDelay;
  #random;
  #now;

  /**
   * Builds the policy.
   * @param {object} [options] - Policy options.
   * @param {number} [options.baseDelay] - Delay before the first retry, in ms.
   * @param {Function} [options.random] - Returns a number in [0, 1); used for jitter.
   * @param {Function} [options.now] - Returns the current time in ms; used for HTTP dates.
   */
  constructor({ baseDelay = BASE_DELAY, random = Math.random, now = Date.now } = {}) {
    this.#baseDelay = baseDelay;
    this.#random = random;
    this.#now = now;
  }

  /**
   * Tells whether a failed attempt may be retried.
   * @param {string} method - Upper-case HTTP method.
   * @param {unknown} error - The error raised by the attempt.
   * @param {AbortSignal} [callerSignal] - The caller's signal; an aborted one is final.
   * @returns {boolean} `true` when the request should be retried.
   */
  shouldRetry(method, error, callerSignal) {
    if (method !== 'GET') {
      return false;
    }
    if (error instanceof NetworkError) {
      return !(callerSignal && callerSignal.aborted);
    }

    return error instanceof ApiError && RETRY_STATUSES.includes(error.status);
  }

  /**
   * Computes the wait before a retry.
   * @param {number} attempt - Zero-based index of the attempt that failed.
   * @param {string|null} [retryAfter] - The `Retry-After` header of a 429, if any.
   * @returns {number} The delay in milliseconds.
   */
  delay(attempt, retryAfter = null) {
    const requested = this.#retryAfterDelay(retryAfter);

    if (requested !== null) {
      return requested;
    }

    const jitter = 0.75 + this.#random() * 0.5;

    return Math.round(this.#baseDelay * (2 ** attempt) * jitter);
  }

  /**
   * Parses a `Retry-After` header, given in seconds or as an HTTP date.
   * @param {string|null} retryAfter - The header value.
   * @returns {number|null} The delay in ms, or `null` when absent or invalid.
   */
  #retryAfterDelay(retryAfter) {
    if (retryAfter === null || retryAfter === undefined || String(retryAfter).trim() === '') {
      return null;
    }

    const value = String(retryAfter).trim();

    if (/^\d+$/.test(value)) {
      return Number(value) * 1000;
    }

    const date = Date.parse(value);

    return Number.isNaN(date) ? null : Math.max(0, date - this.#now());
  }
}
