import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import audienceSeries from '../helpers/audienceSeries.js';
import StatisticsBucketFormatter from '../helpers/StatisticsBucketFormatter.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';

/**
 * Maps a visits bucket to a chart point.
 *
 * @param {object} bucket - A `{ start, end, anonymous, logged_in, visits }` bucket.
 * @param {string} granularity - The resolved granularity.
 * @param {string} [locale] - Locale of the axis label.
 * @returns {object} The chart point.
 */
function toPoint(bucket, granularity, locale) {
  const { start, end, anonymous, logged_in: loggedIn, visits } = bucket;

  return {
    start,
    end,
    label: StatisticsBucketFormatter.label(start, granularity, locale),
    anonymous,
    logged_in: loggedIn,
    visits,
    loggedInShare: visits === 0 ? null : loggedIn / visits,
  };
}

/**
 * Loads the Visits tab data (issue #1507).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/visits.json` for the hash filters. A filter
 *   change navigates to a new hash, remounting the page, so a mount-time fetch is enough.
 */
export default class VisitsController extends BasePageController {
  /**
   * Creates a visits controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `VisitsController.map`).
   * @param {Function} setLoading - Loading flag setter.
   * @param {Function} setError - Error message setter.
   */
  constructor(setData, setLoading, setError) {
    super();
    this.setData = setData;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  /**
   * Maps the visits endpoint response to the chart data.
   *
   * @description Keeps the buckets' order (oldest first), labels them by the resolved
   *   granularity and derives the series to stack from the audience filter.
   * @param {object} response - The `{ filters, buckets, totals }` response body.
   * @param {string} [locale] - Locale of the axis labels (defaults to the browser locale).
   * @returns {{points: object[], series: string[], totals: object, audience: string,
   *   granularity: string, empty: boolean}} The chart data.
   */
  static map(response, locale = undefined) {
    const { filters = {}, buckets = [], totals } = response;
    const audience = filters.audience || 'all';

    return {
      points: buckets.map((bucket) => toPoint(bucket, filters.granularity, locale)),
      series: audienceSeries(audience),
      totals,
      audience,
      granularity: filters.granularity,
      empty: totals.visits === 0,
    };
  }

  /**
   * Builds the data loading effect.
   *
   * @returns {Function} Effect callback returning its cleanup (which drops a late response).
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      this.#fetchVisits(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchVisits(safeSet) {
    return RequestStore.ensure({
      componentName: 'VisitsController',
      resource: 'staffStatistics',
      quantityType: 'visits',
      query: StatisticsQuery.fromHash(),
    })
      .then(({ data }) => safeSet(this.setData, VisitsController.map(data)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.visits.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
