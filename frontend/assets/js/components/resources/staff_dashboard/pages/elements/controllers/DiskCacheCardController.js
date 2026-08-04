import StaffCacheClient from '../../../../../../client/StaffCacheClient.js';
import AuthStorage from '../../../../../../utils/auth/AuthStorage.js';

const RETRY_DELAY_MS = 60000;

/**
 * Manages the disk-cache size fetch, with an automatic 60s retry on
 * failure, for the `DiskCacheCard` element. Not a `BasePageController`
 * subclass since it's scoped to a single card, not a page (same precedent
 * as `MemoryCacheCardController`).
 */
export default class DiskCacheCardController {
  /**
   * Create a disk-cache card controller.
   *
   * @param {Function} setSize - Fetched size (bytes) setter.
   * @param {Function} setLoading - Initial-load loading setter.
   * @param {Function} setError - Load-error setter.
   * @param {StaffCacheClient|null} [client] - Client override.
   */
  constructor(setSize, setLoading, setError, client = null) {
    this.setSize = setSize;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new StaffCacheClient();
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
      let timer = null;
      const safeSet = this.#buildSafeSetter(() => mounted);

      const run = () => {
        this.#fetchSize(safeSet, schedule);
      };

      const schedule = () => {
        if (!mounted) {
          return;
        }

        timer = setTimeout(run, RETRY_DELAY_MS);
      };

      run();

      return () => {
        mounted = false;

        if (timer !== null) {
          clearTimeout(timer);
        }
      };
    };
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
