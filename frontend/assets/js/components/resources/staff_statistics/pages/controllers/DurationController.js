import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import { durationBinKey } from '../helpers/durationBins.js';
import StatisticsBucketFormatter from '../helpers/StatisticsBucketFormatter.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';

/**
 * Divides a part by a number of visits.
 *
 * @param {number} part - The numerator.
 * @param {number} visits - The number of visits.
 * @returns {number|null} The share, or `null` when there are no visits.
 */
function share(part, visits) {
  return visits === 0 ? null : part / visits;
}

/**
 * Maps a duration bucket to a chart point.
 *
 * @param {object} bucket - A `{ start, end, visits, single_hit_visits,
 *   average_duration_seconds, median_duration_seconds, average_hits, median_hits }` bucket.
 * @param {string} granularity - The resolved granularity.
 * @param {string} [locale] - Locale of the axis label.
 * @returns {object} The chart point.
 */
function toPoint(bucket, granularity, locale) {
  const { start, visits, single_hit_visits: singleHitVisits } = bucket;

  return {
    start,
    end: bucket.end,
    label: StatisticsBucketFormatter.label(start, granularity, locale),
    visits,
    single_hit_visits: singleHitVisits,
    singleHitShare: share(singleHitVisits, visits),
    average_duration_seconds: bucket.average_duration_seconds,
    median_duration_seconds: bucket.median_duration_seconds,
    average_hits: bucket.average_hits,
    median_hits: bucket.median_hits,
  };
}

/**
 * Maps a histogram entry to a chart bin.
 *
 * @param {object} entry - A `{ lower, upper, count }` histogram entry.
 * @param {number} totalVisits - The total visits in range.
 * @returns {object} The `{ lower, upper, labelKey, count, share }` bin.
 */
function toBin(entry, totalVisits) {
  const { lower, count } = entry;

  return {
    lower, upper: entry.upper, labelKey: durationBinKey(lower), count, share: share(count, totalVisits),
  };
}

/**
 * Loads the Duration tab data (issue #1514).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/duration.json` for the hash filters. A
 *   filter change navigates to a new hash, remounting the page, so a mount-time fetch is
 *   enough.
 */
export default class DurationController extends BasePageController {
  /**
   * Creates a duration controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `DurationController.map`).
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
   * Maps the duration endpoint response to the charts data.
   *
   * @description Keeps the buckets' order (oldest first), labels them by the resolved
   *   granularity and derives the single-hit share (`null` for buckets without visits). The
   *   histogram bins get their label key (translated at render time) and their share of the
   *   total visits (`null` when there are none).
   * @param {object} response - The `{ filters, buckets, totals, histogram }` response body.
   * @param {string} [locale] - Locale of the axis labels (defaults to the browser locale).
   * @returns {{points: object[], bins: object[], totals: object, granularity: string,
   *   empty: boolean}} The charts data.
   */
  static map(response, locale = undefined) {
    const { filters = {}, buckets = [], histogram = [], totals } = response;

    return {
      points: buckets.map((bucket) => toPoint(bucket, filters.granularity, locale)),
      bins: histogram.map((entry) => toBin(entry, totals.visits)),
      totals: { ...totals, singleHitShare: share(totals.single_hit_visits, totals.visits) },
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

      this.#fetchDuration(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchDuration(safeSet) {
    return RequestStore.ensure({
      componentName: 'DurationController',
      resource: 'staffStatistics',
      quantityType: 'duration',
      query: StatisticsQuery.fromHash(),
    })
      .then(({ data }) => safeSet(this.setData, DurationController.map(data)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.duration.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
