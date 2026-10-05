import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import audienceSeries from '../helpers/audienceSeries.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';

const UNKNOWN_ID = 'unknown';

/**
 * Maps a domain row of the response to a table / chart row.
 *
 * @param {object} row - A `{ id, domain, group, visits, anonymous, logged_in,
 *   unique_visitors, average_duration_seconds, median_duration_seconds }` row.
 * @returns {object} The mapped row, with its `label`, `loggedInShare` and `unknown` flag.
 */
function toRow(row) {
  const { id, visits, logged_in: loggedIn } = row;
  const unknown = id === UNKNOWN_ID;

  return {
    id,
    domain: row.domain,
    group: row.group,
    label: unknown ? Translator.t('staff_statistics_page.domains.unknown') : row.domain,
    anonymous: row.anonymous,
    logged_in: loggedIn,
    visits,
    unique_visitors: row.unique_visitors,
    average_duration_seconds: row.average_duration_seconds,
    median_duration_seconds: row.median_duration_seconds,
    loggedInShare: visits === 0 ? null : loggedIn / visits,
    unknown,
  };
}

/**
 * Loads the Domains tab data (issue #1517).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/domains/summary.json` for the hash filters.
 *   A filter change navigates to a new hash, remounting the page, so a mount-time fetch is
 *   enough.
 */
export default class DomainsController extends BasePageController {
  /**
   * Creates a domains controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `DomainsController.map`).
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
   * Maps the domains summary response to the chart and table data.
   *
   * @description Keeps the API row order (the "unknown" row last), labels the unknown row
   *   with its translated label, derives the logged-in share (`null` for rows without visits)
   *   and the series to show from the audience filter.
   * @param {object} response - The `{ filters, domains, totals }` response body.
   * @returns {{domains: object[], totals: object, series: string[], audience: string,
   *   filters: object, empty: boolean, noRows: boolean}} The chart and table data.
   */
  static map(response) {
    const { filters = {}, domains = [], totals } = response;
    const { audience } = filters;

    return {
      domains: domains.map(toRow),
      totals,
      series: audienceSeries(audience),
      audience,
      filters,
      empty: totals.visits === 0,
      noRows: domains.length === 0,
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

      this.#fetchDomains(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchDomains(safeSet) {
    return RequestStore.ensure({
      componentName: 'DomainsController',
      resource: 'staffStatistics',
      quantityType: 'domainsSummary',
      query: StatisticsQuery.fromHash(),
    })
      .then(({ data }) => safeSet(this.setData, DomainsController.map(data)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.domains.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
