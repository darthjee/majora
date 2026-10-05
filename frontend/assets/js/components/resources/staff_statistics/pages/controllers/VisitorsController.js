import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import audienceSeries from '../helpers/audienceSeries.js';
import StatisticsBucketFormatter from '../helpers/StatisticsBucketFormatter.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';

/**
 * Divides a part by the bucket's unique visitors.
 *
 * @param {number} part - The numerator.
 * @param {number} uniqueVisitors - The bucket's unique visitors.
 * @returns {number|null} The share, or `null` when the bucket has no visitors.
 */
function share(part, uniqueVisitors) {
  return uniqueVisitors === 0 ? null : part / uniqueVisitors;
}

/**
 * Maps a visitors bucket to a chart point.
 *
 * @param {object} bucket - A `{ start, end, unique_visitors, new_visitors,
 *   returning_visitors, anonymous, logged_in }` bucket.
 * @param {string} granularity - The resolved granularity.
 * @param {string} [locale] - Locale of the axis label.
 * @returns {object} The chart point.
 */
function toPoint(bucket, granularity, locale) {
  const {
    start, end, unique_visitors: uniqueVisitors, returning_visitors: returningVisitors,
    logged_in: loggedIn,
  } = bucket;

  return {
    start,
    end,
    label: StatisticsBucketFormatter.label(start, granularity, locale),
    unique_visitors: uniqueVisitors,
    new_visitors: bucket.new_visitors,
    returning_visitors: returningVisitors,
    anonymous: bucket.anonymous,
    logged_in: loggedIn,
    returningShare: share(returningVisitors, uniqueVisitors),
    loggedInShare: share(loggedIn, uniqueVisitors),
  };
}

/**
 * Loads the Visitors tab data (issue #1510).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/visitors.json` for the hash filters. A
 *   filter change navigates to a new hash, remounting the page, so a mount-time fetch is
 *   enough.
 */
export default class VisitorsController extends BasePageController {
  /**
   * Creates a visitors controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `VisitorsController.map`).
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
   * Maps the visitors endpoint response to the charts data.
   *
   * @description Keeps the buckets' order (oldest first), labels them by the resolved
   *   granularity, derives the returning / logged-in shares (`null` for buckets without
   *   visitors) and the audience chart series from the audience filter.
   * @param {object} response - The `{ filters, buckets, totals }` response body.
   * @param {string} [locale] - Locale of the axis labels (defaults to the browser locale).
   * @returns {{points: object[], audienceSeries: string[], totals: object, audience: string,
   *   granularity: string, empty: boolean}} The charts data.
   */
  static map(response, locale = undefined) {
    const { filters = {}, buckets = [], totals } = response;
    const audience = filters.audience || 'all';

    return {
      points: buckets.map((bucket) => toPoint(bucket, filters.granularity, locale)),
      audienceSeries: audienceSeries(audience),
      totals,
      audience,
      granularity: filters.granularity,
      empty: totals.unique_visitors === 0,
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

      this.#fetchVisitors(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchVisitors(safeSet) {
    return RequestStore.ensure({
      componentName: 'VisitorsController',
      resource: 'staffStatistics',
      quantityType: 'visitors',
      query: StatisticsQuery.fromHash(),
    })
      .then(({ data }) => safeSet(this.setData, VisitorsController.map(data)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.visitors.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
