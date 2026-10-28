import RequestStore from '../../../../../../utils/requests/RequestStore.js';

const COMPONENT_NAME = 'VisitsSummaryCardController';
const RESOURCE = 'staffStatistics';

/**
 * Resolves the browser's IANA timezone, or `null` when it is unavailable.
 *
 * @returns {?string} The timezone name, or `null`.
 */
const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Manages the unique-visitors summary fetch, the period switch and the clear/refresh actions
 * of the `VisitsSummaryCard` element (issue #1685).
 *
 * @description Not a `BasePageController` subclass since it is scoped to a single card, like
 *   `MemoryCacheCardController`. Requests go through `RequestStore`: `GET.summary` for the
 *   count and `DELETE.clear` for the clear. A refresh purges the `staffStatistics` cache first,
 *   so it always issues a new request.
 */
export default class VisitsSummaryCardController {
  /**
   * Create a visits-summary card controller.
   *
   * @param {Function} setSummary - Unique-visitors count setter.
   * @param {Function} setStatus - Clear status setter (`'idle'`, `'loading'`, `'error'` or
   *   `{state: 'success', deletedVisits, deletedSessions}`).
   * @param {Function} setLoading - Summary loading setter.
   * @param {Function} setError - Summary-load error setter.
   * @param {Function} [timezone] - Timezone resolver override (tests).
   */
  constructor(setSummary, setStatus, setLoading, setError, timezone = browserTimezone) {
    this.setSummary = setSummary;
    this.setStatus = setStatus;
    this.setLoading = setLoading;
    this.setError = setError;
    this.timezone = timezone;
    this.period = 'day';
  }

  /**
   * Build the card's mount effect, fetching the summary once.
   *
   * @returns {Function} Effect callback returning its cleanup (which drops a late response).
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
   * Switch the summary period and fetch it.
   *
   * @param {string} period - The new period (`'day'`, `'week'` or `'month'`).
   * @returns {Promise<void>} Resolves when the fetch handling finishes.
   */
  changePeriod(period) {
    this.period = period;

    return this.#fetchSummary(this.#buildSafeSetter(() => true));
  }

  /**
   * Re-fetch the summary for the current period, bypassing any cached result.
   *
   * @returns {Promise<void>} Resolves when the fetch handling finishes.
   */
  refresh() {
    RequestStore.purge({ resource: RESOURCE });

    return this.#fetchSummary(this.#buildSafeSetter(() => true));
  }

  /**
   * Clear every statistic, then refresh the summary (even on failure, since a partial clear
   * may have happened).
   *
   * @returns {Promise<void>} Resolves when the clear and the refresh finish.
   */
  async clear() {
    this.setStatus('loading');

    try {
      const response = await RequestStore.mutate({
        componentName: COMPONENT_NAME,
        resource: RESOURCE,
        method: 'DELETE',
        quantityType: 'clear',
        variantName: 'regular',
      });

      this.setStatus(await this.#clearStatus(response));
    } catch {
      this.setStatus('error');
    }

    await this.refresh();
  }

  async #clearStatus(response) {
    if (!response.ok) {
      return 'error';
    }

    const body = await response.json();

    return {
      state: 'success',
      deletedVisits: body.deleted_visits,
      deletedSessions: body.deleted_sessions,
    };
  }

  #buildQuery() {
    const query = { period: this.period };
    const tz = this.#resolveTimezone();

    if (tz) {
      query.tz = tz;
    }

    return query;
  }

  #resolveTimezone() {
    try {
      return this.timezone() || null;
    } catch {
      return null;
    }
  }

  #fetchSummary(safeSet) {
    safeSet(this.setLoading, true);
    safeSet(this.setError, false);

    return RequestStore.ensure({
      componentName: COMPONENT_NAME,
      resource: RESOURCE,
      quantityType: 'summary',
      query: this.#buildQuery(),
    })
      .then(({ data }) => safeSet(this.setSummary, data.unique_visitors))
      .catch(() => safeSet(this.setError, true))
      .finally(() => safeSet(this.setLoading, false));
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
