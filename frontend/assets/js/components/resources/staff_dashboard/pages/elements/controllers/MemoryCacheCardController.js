import StaffCacheClient from '../../../../../../client/StaffCacheClient.js';
import AuthStorage from '../../../../../../utils/auth/AuthStorage.js';

/**
 * Manages the memory-cache summary fetch and clear/refresh actions for the
 * `MemoryCacheCard` element. Not a `BasePageController` subclass since it's
 * scoped to a single card, not a page (same precedent as
 * `OpenPollsWidgetController`).
 */
export default class MemoryCacheCardController {
  /**
   * Create a memory-cache card controller.
   *
   * @param {Function} setSummary - Summary (`{size, limit}`) setter.
   * @param {Function} setStatus - Action status setter (`idle`, `loading`, `success`, `error`).
   * @param {Function} setLoading - Initial-load loading setter.
   * @param {Function} setError - Summary-load error setter.
   * @param {StaffCacheClient|null} [client] - Client override.
   */
  constructor(setSummary, setStatus, setLoading, setError, client = null) {
    this.setSummary = setSummary;
    this.setStatus = setStatus;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new StaffCacheClient();
  }

  /**
   * Build the card's mount effect, fetching the cache summary once.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.#buildSafeSetter(() => mounted);

      this.#fetchSummary(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Re-fetches the cache summary, e.g. after a manual refresh or a clear.
   *
   * @returns {Promise<void>} Resolves when the fetch handling finishes.
   */
  refresh() {
    return this.#fetchSummary(this.#buildSafeSetter(() => true));
  }

  /**
   * Clears the server-side cache, then refreshes the summary on success.
   *
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async clearCache() {
    this.setStatus('loading');

    const token = AuthStorage.getToken();

    try {
      const response = await this.client.clearCache(token);

      if (!response.ok) {
        this.setStatus('error');
        return;
      }

      this.setStatus('success');
      await this.refresh();
    } catch {
      this.setStatus('error');
    }
  }

  /**
   * Logs the raw summary data to the console at debug level, bypassing
   * `MajoraLogger` so it always fires regardless of the configured build-time
   * log level (a deliberate, confirmed exception — see issue #780).
   *
   * @param {object} summary - Raw summary data (`{size, limit}`).
   * @returns {void}
   */
  logData(summary) {
    // eslint-disable-next-line no-console -- deliberate exception, see issue #780
    console.debug(summary);
  }

  async #fetchSummary(safeSet) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.client.fetchSummary(token);

      if (!response.ok) {
        safeSet(this.setError, true);
        return;
      }

      const summary = await response.json();

      safeSet(this.setSummary, summary);
    } catch {
      safeSet(this.setError, true);
    } finally {
      safeSet(this.setLoading, false);
    }
  }

  #buildSafeSetter(isMounted) {
    return (setter, value) => {
      if (!isMounted()) {
        return;
      }

      setter(value);
    };
  }
}
