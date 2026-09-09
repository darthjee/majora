import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import CrawlerClient from '../../../../../client/CrawlerClient.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

// Mirrors the backend's CrawlerDebugEmissionPaginator.PAGE_SIZE (hoisted locally rather than
// imported cross-language) — a page returning exactly this many records means there may still
// be more to drain; fewer means the feed has caught up and polling can start.
const PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 10000;
const FETCH_ERROR_MESSAGE = 'Unable to load crawler feed.';

/**
 * Controller for the staff crawler debug page (issue #1274): drains every retained emission
 * record page-by-page on mount, then switches to polling for new records every 10 seconds.
 *
 * @description No `RequestStore` involvement — this is a plain `GET`-only read loop, same
 *   category as `SessionMessagesController#loadFirstPage`/`#loadMore`.
 */
export default class StaffCrawlerController extends BasePageController {
  #stopped = false;

  /**
   * Create a staff crawler controller.
   *
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} setEmissions - Emissions array setter (accepts a functional update).
   * @param {Function} setSelectedId - Selected emission id setter.
   * @param {CrawlerClient} [client] - Client override.
   */
  constructor(setLoading, setError, setEmissions, setSelectedId, client = new CrawlerClient()) {
    super();
    this.setLoading = setLoading;
    this.setError = setError;
    this.setEmissions = setEmissions;
    this.setSelectedId = setSelectedId;
    this.client = client;
    this.lastId = undefined;
    this.intervalId = null;
  }

  /**
   * Build the page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page, otherwise clears the
   *   loading state and kicks off the drain-then-poll feed. The returned cleanup stops the
   *   feed so an in-flight drain/poll doesn't keep setting state after unmount.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AccessStore.ensureStaffOrSuperUser()
        .then((isStaffOrSuperUser) => {
          if (!mounted) {
            return;
          }

          if (!isStaffOrSuperUser) {
            this.redirectTo('/');
            return;
          }

          safeSet(this.setLoading, false);
          this.startFeed();
        })
        .catch(() => safeSet(this.setError, FETCH_ERROR_MESSAGE));

      return () => {
        mounted = false;
        this.stopFeed();
      };
    };
  }

  /**
   * Drain every retained emission page-by-page, starting from the beginning of the retained
   * window, until a page comes back with fewer than `PAGE_SIZE` records — then switch to polling.
   *
   * @returns {Promise<void>} Resolves once the drain phase has finished (or polling has started).
   */
  async startFeed() {
    const token = AuthStorage.getToken();

    return this.#drain(token);
  }

  /**
   * Stop the feed: prevents any in-flight drain/poll fetch from setting state further, and
   * clears the polling interval if one is running. Safe to call repeatedly.
   *
   * @returns {void}
   */
  stopFeed() {
    this.#stopped = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Select an emission record for detail display.
   *
   * @param {number|string} id - Selected emission's id.
   * @returns {void}
   */
  selectEmission(id) {
    this.setSelectedId(id);
  }

  async #drain(token) {
    if (this.#stopped) {
      return;
    }

    try {
      const response = await this.client.fetchEmissions(this.lastId, token);
      const page = await response.json();

      this.#appendPage(page);

      if (page.length === PAGE_SIZE) {
        await this.#drain(token);
      } else {
        this.#startPolling();
      }
    } catch {
      if (!this.#stopped) {
        this.setError(FETCH_ERROR_MESSAGE);
      }
    }
  }

  #startPolling() {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => this.#poll(), POLL_INTERVAL_MS);
  }

  async #poll() {
    if (this.#stopped) {
      return;
    }

    try {
      const token = AuthStorage.getToken();
      const response = await this.client.fetchEmissions(this.lastId, token);
      const page = await response.json();

      this.#appendPage(page);
    } catch {
      if (!this.#stopped) {
        this.setError(FETCH_ERROR_MESSAGE);
      }
    }
  }

  #appendPage(page) {
    if (this.#stopped || page.length === 0) {
      return;
    }

    this.setEmissions((previous) => [...previous, ...page]);
    this.lastId = page[page.length - 1].id;
  }
}
