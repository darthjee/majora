const RESILIENCE_CHANGED_EVENT = 'resilience:changed';

let inFlightCount = 0;
let retryWaitCount = 0;

/**
 * Tracks the global state of resilient (retrying) HTTP requests and
 * broadcasts changes through a `window`-level custom event, so any part of
 * the app (e.g. a header indicator) can reflect whether requests are
 * currently idle, in flight, or being retried after a transient failure.
 */
export default class ResilienceEvents {
  /**
   * Marks a resilient request as started, moving the global status towards
   * `'requesting'` (unless a retry is already in progress).
   *
   * @returns {void}
   */
  static requestStarted() {
    inFlightCount += 1;
    ResilienceEvents.#emit();
  }

  /**
   * Marks a resilient request as finished, regardless of whether it
   * ultimately succeeded or failed with a non-retryable error.
   *
   * @returns {void}
   */
  static requestSucceeded() {
    inFlightCount = Math.max(0, inFlightCount - 1);
    ResilienceEvents.#emit();
  }

  /**
   * Marks a resilient request as having failed transiently and now waiting
   * to retry, moving the global status to `'retrying'`.
   *
   * @returns {void}
   */
  static retryScheduled() {
    retryWaitCount += 1;
    ResilienceEvents.#emit();
  }

  /**
   * Marks a scheduled retry as now being attempted, leaving the
   * retry-wait state.
   *
   * @returns {void}
   */
  static retryAttempting() {
    retryWaitCount = Math.max(0, retryWaitCount - 1);
    ResilienceEvents.#emit();
  }

  /**
   * Derives the current global resilience status.
   *
   * @returns {'idle'|'requesting'|'retrying'} `'retrying'` when at least one
   *   request is waiting to retry; else `'requesting'` when at least one
   *   request is in flight; else `'idle'`.
   */
  static getStatus() {
    if (retryWaitCount > 0) {
      return 'retrying';
    }

    if (inFlightCount > 0) {
      return 'requesting';
    }

    return 'idle';
  }

  /**
   * Subscribes a handler to resilience status changes.
   *
   * @param {Function} handler - Callback invoked when the status changes.
   * @returns {void}
   */
  static subscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener(RESILIENCE_CHANGED_EVENT, handler);
  }

  /**
   * Unsubscribes a handler from resilience status changes.
   *
   * @param {Function} handler - Callback previously passed to `subscribe`.
   * @returns {void}
   */
  static unsubscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener(RESILIENCE_CHANGED_EVENT, handler);
  }

  /**
   * Dispatches the `resilience:changed` event on `window` with the current status.
   *
   * @returns {void}
   */
  static #emit() {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(RESILIENCE_CHANGED_EVENT, { detail: { status: ResilienceEvents.getStatus() } }));
  }
}
