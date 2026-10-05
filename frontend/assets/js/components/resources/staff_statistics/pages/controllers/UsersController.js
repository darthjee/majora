import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';
import { currentSort, sortQuery } from '../helpers/usersSort.js';

const UNKNOWN_ID = 'unknown';

/**
 * Labels a user row's domain.
 *
 * @param {{id: (number|string), domain: ?string}} domain - A `{ id, domain }` entry.
 * @returns {string} The hostname, or the translated "unknown" label for the unknown entry.
 */
function domainLabel({ id, domain }) {
  return id === UNKNOWN_ID ? Translator.t('staff_statistics_page.users.unknown_domain') : domain;
}

/**
 * Maps a user row of the response to a table row.
 *
 * @param {object} row - A `{ id, name, display_name, email, visits, time_on_site_seconds,
 *   average_duration_seconds, hits, domains, last_seen_at }` row.
 * @returns {object} The camelCased row, with its domains as labels.
 */
function toRow(row) {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    email: row.email,
    visits: row.visits,
    timeOnSiteSeconds: row.time_on_site_seconds,
    averageDurationSeconds: row.average_duration_seconds,
    hits: row.hits,
    domains: (row.domains ?? []).map(domainLabel),
    lastSeenAt: row.last_seen_at,
  };
}

/**
 * Loads the Users tab data (issue #1520).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/users.json` for the hash filters, the
 *   server-side `sort` (omitted for the default) and the `page` / `per_page` params. A
 *   filter, sort or page change navigates to a new hash, so the effect reruns per hash.
 */
export default class UsersController extends BasePageController {
  /**
   * Creates a users controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `UsersController.map`).
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
   * Maps the users ranking response to the table data.
   *
   * @description Keeps the API row order (already sorted server-side) and labels each row's
   *   domains (the "unknown" entry translated).
   * @param {object[]} rows - The plain array of user rows.
   * @param {{page: number, pages: number, perPage: number}} [pagination] - The pagination
   *   metadata from the response headers.
   * @param {string} sort - The current sort key.
   * @returns {{rows: object[], page: number, pages: number, perPage: number, sort: string,
   *   empty: boolean}} The table data.
   */
  static map(rows, pagination, sort) {
    const list = Array.isArray(rows) ? rows : [];
    const { page = 1, pages = 1, perPage } = pagination ?? {};

    return {
      rows: list.map(toRow),
      page,
      pages,
      perPage,
      sort,
      empty: list.length === 0,
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

      this.#fetchUsers(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchUsers(safeSet) {
    const sort = currentSort();

    return RequestStore.ensure({
      componentName: 'UsersController',
      resource: 'staffStatistics',
      quantityType: 'usersRanking',
      query: {
        ...StatisticsQuery.fromHash(),
        ...sortQuery(sort),
        ...Object.fromEntries(new HashRouteResolver().getPaginationParams()),
      },
    })
      .then(({ data, pagination }) => safeSet(this.setData, UsersController.map(data, pagination, sort)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.users.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
