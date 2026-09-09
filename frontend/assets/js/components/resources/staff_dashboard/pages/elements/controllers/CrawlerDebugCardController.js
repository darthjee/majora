import CrawlerClient from '../../../../../../client/CrawlerClient.js';
import AuthStorage from '../../../../../../utils/auth/AuthStorage.js';

/**
 * Manages the crawler-summary fetch and clear/refresh actions for the
 * `CrawlerDebugCard` element. Not a `BasePageController` subclass since it's
 * scoped to a single card, not a page (same precedent as
 * `OpenPollsWidgetController`).
 */
export default class CrawlerDebugCardController {
  /**
   * Create a crawler debug card controller.
   *
   * @param {Function} setCounts - Counts (`{ "<type>": <count> }`) setter.
   * @param {Function} setStatus - Action status setter (`idle`, `loading`, `success`, `error`).
   * @param {Function} setLoading - Initial-load loading setter.
   * @param {Function} setError - Summary-load error setter.
   * @param {CrawlerClient|null} [client] - Client override.
   */
  constructor(setCounts, setStatus, setLoading, setError, client = null) {
    this.setCounts = setCounts;
    this.setStatus = setStatus;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new CrawlerClient();
  }

  /**
   * Build the card's mount effect, fetching the crawler summary once.
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
   * Re-fetches the crawler summary, e.g. after a manual refresh or a clear.
   *
   * @returns {Promise<void>} Resolves when the fetch handling finishes.
   */
  refresh() {
    return this.#fetchSummary(this.#buildSafeSetter(() => true));
  }

  /**
   * Clears every retained crawler emission, then refreshes the summary on success.
   *
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async clearEmissions() {
    this.setStatus('loading');

    const token = AuthStorage.getToken();

    try {
      const response = await this.client.clearEmissions(token);

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

  async #fetchSummary(safeSet) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.client.fetchSummary(token);

      if (!response.ok) {
        safeSet(this.setError, true);
        return;
      }

      const counts = await response.json();

      safeSet(this.setCounts, counts);
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
