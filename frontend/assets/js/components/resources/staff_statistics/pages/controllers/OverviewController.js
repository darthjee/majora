import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';

/**
 * Loads the Overview tab data (issue #1504).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/overview.json` for the hash filters. A filter
 *   change navigates to a new hash, remounting the page, so a mount-time fetch is enough.
 */
export default class OverviewController extends BasePageController {
  /**
   * Creates an overview controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `OverviewController.map`).
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
   * Maps the overview endpoint response to the KPI tiles data.
   *
   * @description `returningShare` is `returning_visitors / unique_visitors`, or `null` when
   *   there are no unique visitors (the share is then hidden). `empty` flags a range without
   *   visits.
   * @param {object} response - The `{ filters, totals }` response body.
   * @returns {{totals: object, returningShare: ?number, empty: boolean}} The tiles data.
   */
  static map(response) {
    const { totals } = response;
    const uniqueVisitors = totals.unique_visitors;

    return {
      totals,
      returningShare: uniqueVisitors === 0 ? null : totals.returning_visitors / uniqueVisitors,
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

      this.#fetchOverview(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchOverview(safeSet) {
    return RequestStore.ensure({
      componentName: 'OverviewController',
      resource: 'staffStatistics',
      quantityType: 'overview',
      query: StatisticsQuery.fromHash(),
    })
      .then(({ data }) => safeSet(this.setData, OverviewController.map(data)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.overview.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
