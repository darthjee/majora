import StaffCacheClient from '../../../../../../client/StaffCacheClient.js';
import AuthStorage from '../../../../../../utils/auth/AuthStorage.js';
import Noop from '../../../../../../utils/Noop.js';

const RETRY_DELAY_MS = 60000;

/**
 * Manages the disk-cache size fetch, with an automatic 60s retry on
 * failure, plus manual refresh and clear-cache actions, for the
 * `DiskCacheCard` element. Not a `BasePageController` subclass since it's
 * scoped to a single card, not a page (same precedent as
 * `MemoryCacheCardController`).
 */
export default class DiskCacheCardController {
  /**
   * Create a disk-cache card controller.
   *
   * @param {Function} setSize - Fetched size (bytes) setter.
   * @param {Function} setStatus - Action status setter (`idle`, `loading`, `success`, `error`).
   * @param {Function} setLoading - Initial-load loading setter.
   * @param {Function} setError - Load-error setter.
   * @param {StaffCacheClient|null} [client] - Client override.
   */
  constructor(setSize, setStatus, setLoading, setError, client = null) {
    this.setSize = setSize;
    this.setStatus = setStatus;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new StaffCacheClient();
    this.retryTimer = null;
  }

  /**
   * Build the card's mount effect, fetching the disk cache size once and
   * scheduling a retry every 60s while it keeps failing.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.#buildSafeSetter(() => mounted);

      const run = () => {
        this.#fetchSize(safeSet, schedule);
      };

      const schedule = () => {
        if (!mounted) {
          return;
        }

        this.retryTimer = setTimeout(run, RETRY_DELAY_MS);
      };

      run();

      return () => {
        mounted = false;

        if (this.retryTimer !== null) {
          clearTimeout(this.retryTimer);
          this.retryTimer = null;
        }
      };
    };
  }

  /**
   * Re-fetches the disk cache size, e.g. after a manual refresh, cancelling
   * any pending automatic retry first.
   *
   * @returns {Promise<void>} Resolves when the fetch handling finishes.
   */
  refresh() {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    return this.#fetchSize(this.#buildSafeSetter(() => true), Noop.noop);
  }

  /**
   * Clears the on-disk cache, then refreshes the size on success.
   *
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async clearCache() {
    this.setStatus('loading');

    const token = AuthStorage.getToken();

    try {
      const response = await this.client.clearDiskCache(token);

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

  async #fetchSize(safeSet, scheduleRetry) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.client.fetchDiskCacheSize(token);

      if (!response.ok) {
        safeSet(this.setError, true);
        scheduleRetry();
        return;
      }

      const { size } = await response.json();

      safeSet(this.setSize, size);
      safeSet(this.setError, false);
    } catch {
      safeSet(this.setError, true);
      scheduleRetry();
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
