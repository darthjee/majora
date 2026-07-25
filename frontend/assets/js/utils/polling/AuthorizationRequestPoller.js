import AuthClient from '../../client/AuthClient.js';

const DEFAULT_INTERVAL_MS = 5000;

/**
 * Polls a pending device-authorization login request until a terminal
 * outcome is reached, modeled on `HeaderController`'s
 * `startHealthCheck`/`stopHealthCheck`/`#pollHealth` interval shape.
 *
 * @description Transient poll failures (network errors) are reported via a
 *   `'retrying'` event but never stop the interval — only a real terminal
 *   response (`202` approved, `422` expired, `403` denied/not-found) or the
 *   request's own client-side expiration timestamp elapsing stops it. The
 *   server remains the source of truth for expiration either way (see the
 *   backend's lazy-expiration handling); the client-side check here is
 *   purely a UX nicety, avoiding polling a request already known to be dead.
 */
export default class AuthorizationRequestPoller {
  /**
   * Creates a new poller instance.
   *
   * @param {AuthClient} [client] - HTTP client used to poll the authorization request.
   */
  constructor(client = new AuthClient()) {
    this.client = client;
    this.intervalId = null;
  }

  /**
   * Starts polling the given authorization request at the given interval.
   * Stops any previously running poll before starting.
   *
   * @param {{uuid: string, token: string, expiration: string}} request - Authorization
   *   request identifiers/expiration, as returned by `AuthClient#createAuthorizationRequest`.
   * @param {Function} onEvent - Callback invoked with `{status, token}` on every poll tick;
   *   `status` is one of `'open'` (still pending), `'retrying'` (transient failure, still
   *   polling), or a terminal outcome (`'approved'` — carries `token` —, `'denied'`, or
   *   `'expired'`), after which the poller has already stopped itself.
   * @param {number} [intervalMs] - Polling interval in milliseconds.
   * @returns {void}
   */
  start(request, onEvent, intervalMs = DEFAULT_INTERVAL_MS) {
    this.stop();
    this.intervalId = setInterval(() => this.#poll(request, onEvent), intervalMs);
  }

  /**
   * Stops the polling interval, if one is running. Safe to call repeatedly
   * or when no poll is running.
   *
   * @returns {void}
   */
  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  async #poll(request, onEvent) {
    if (new Date(request.expiration).getTime() <= Date.now()) {
      this.stop();
      onEvent({ status: 'expired' });
      return;
    }

    let response;

    try {
      response = await this.client.pollAuthorizationRequest(request.uuid, request.token);
    } catch {
      onEvent({ status: 'retrying' });
      return;
    }

    await this.#handleResponse(response, onEvent);
  }

  async #handleResponse(response, onEvent) {
    if (response.status === 202) {
      const data = await response.json();

      this.stop();
      onEvent({ status: 'approved', token: data.token });
      return;
    }

    if (response.status === 422) {
      this.stop();
      onEvent({ status: 'expired' });
      return;
    }

    if (response.status === 403) {
      this.stop();
      onEvent({ status: 'denied' });
      return;
    }

    onEvent({ status: 'open' });
  }
}
