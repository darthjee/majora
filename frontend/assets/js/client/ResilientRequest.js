import ResilienceEvents from '../utils/logging/ResilienceEvents.js';

const DEFAULT_RETRY_DELAY_MS = 5000;

/**
 * Wraps a single logical HTTP request (an attempt function returning a
 * `Promise<Response>`) so it retries indefinitely on a `502` response or a
 * request timeout, only settling once a final outcome is reached, while
 * reporting its progress through {@link ResilienceEvents}.
 */
export default class ResilientRequest {
  /**
   * Creates a resilient request wrapper.
   *
   * @param {Function} attempt - Function performing a single attempt, returning `Promise<Response>`.
   * @param {object} [options] - Retry options.
   * @param {number} [options.retryDelayMs=5000] - Delay between retries, in milliseconds.
   */
  constructor(attempt, { retryDelayMs = DEFAULT_RETRY_DELAY_MS } = {}) {
    this.attempt = attempt;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * Runs the wrapped attempt, retrying on transient failures until a final
   * outcome is reached or the request is cancelled.
   *
   * @description A transient failure is a `502` response, or a thrown error
   *   whose `name` is `'TimeoutError'` (the error `AbortSignal.timeout`
   *   produces). Any other thrown error propagates immediately instead of
   *   being retried. Cancellation is checked right after each attempt (and
   *   again after each retry wait), so a pending retry never resolves after
   *   the caller has cancelled it.
   * @param {{cancelled: boolean}} [cancelToken] - cancellation flag; polled between attempts.
   * @returns {Promise<Response>} resolves with the final response, or rejects
   *   with the first non-transient thrown error.
   */
  async run(cancelToken = { cancelled: false }) {
    ResilienceEvents.requestStarted();

    try {
      return await this.#loop(cancelToken);
    } finally {
      ResilienceEvents.requestSucceeded();
    }
  }

  async #loop(cancelToken) {
    let lastResponse;

    while (!cancelToken.cancelled) {
      const outcome = await this.#attemptOnce();

      lastResponse = outcome.response;

      if (cancelToken.cancelled) {
        return lastResponse;
      }

      if (!outcome.transient) {
        if (outcome.error) {
          throw outcome.error;
        }
        return lastResponse;
      }

      ResilienceEvents.retryScheduled();
      await ResilientRequest.#wait(this.retryDelayMs);
      ResilienceEvents.retryAttempting();
    }

    return lastResponse;
  }

  async #attemptOnce() {
    try {
      const response = await this.attempt();

      return { response, transient: response?.status === 502 };
    } catch (error) {
      if (error?.name === 'TimeoutError') {
        return { transient: true };
      }

      return { transient: false, error };
    }
  }

  static #wait(delayMs) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
