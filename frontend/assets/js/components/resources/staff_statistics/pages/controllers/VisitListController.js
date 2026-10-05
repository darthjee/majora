import Translator from '../../../../../i18n/Translator.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import StatisticsQuery from '../helpers/StatisticsQuery.js';
import { currentSort, sortQuery } from '../helpers/visitListSort.js';

const UNKNOWN_ID = 'unknown';

/**
 * Labels a visit row's domain.
 *
 * @param {?{id: (number|string), domain: ?string}} domain - A `{ id, domain }` entry.
 * @returns {?string} The hostname, the translated "unknown" label for the unknown entry, or
 *   `null` when the row has no domain.
 */
function domainLabel(domain) {
  if (!domain) return null;

  return domain.id === UNKNOWN_ID
    ? Translator.t('staff_statistics_page.visit_list.unknown_domain')
    : domain.domain;
}

/**
 * Maps a visit row's user.
 *
 * @param {?{id: number, name: string, display_name: string, email: string}} user - The
 *   visit's user, or `null` for an anonymous visit.
 * @returns {?{id: number, name: string, displayName: string, email: string}} The camelCased
 *   user, or `null`.
 */
function toUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    displayName: user.display_name,
    email: user.email,
  };
}

/**
 * Maps a visit row of the response to a table row.
 *
 * @param {object} row - A `{ id, started_at, last_seen_at, duration_seconds, hits, ongoing,
 *   ip, domain, session_id, user }` row.
 * @returns {object} The camelCased row, with its domain as a label.
 */
function toRow(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    lastSeenAt: row.last_seen_at,
    durationSeconds: row.duration_seconds,
    hits: row.hits,
    ongoing: Boolean(row.ongoing),
    ip: row.ip,
    domain: domainLabel(row.domain),
    sessionId: row.session_id,
    user: toUser(row.user),
  };
}

/**
 * Loads the Visit list tab data (issue #1523).
 *
 * @description The page access check happens in `StaffStatisticsAccessGate`, so this
 *   controller only loads `GET /staff/statistics/visit-list.json` for the hash filters, the
 *   server-side `sort` (omitted for the default) and the `page` / `per_page` params. A
 *   filter, sort or page change navigates to a new hash, so the effect reruns per hash.
 */
export default class VisitListController extends BasePageController {
  /**
   * Creates a visit list controller.
   *
   * @param {Function} setData - Setter of the mapped data (see `VisitListController.map`).
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
   * Maps the visit list response to the table data.
   *
   * @description Keeps the API row order (already sorted server-side), labels each row's
   *   domain (the "unknown" entry translated) and keeps the user `null` for anonymous visits.
   * @param {object[]} rows - The plain array of visit rows.
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

      this.#fetchVisits(safeSet);

      return () => {
        mounted = false;
      };
    };
  }

  #fetchVisits(safeSet) {
    const sort = currentSort();

    return RequestStore.ensure({
      componentName: 'VisitListController',
      resource: 'staffStatistics',
      quantityType: 'visitList',
      query: {
        ...StatisticsQuery.fromHash(),
        ...sortQuery(sort),
        ...Object.fromEntries(new HashRouteResolver().getPaginationParams()),
      },
    })
      .then(({ data, pagination }) => safeSet(this.setData, VisitListController.map(data, pagination, sort)))
      .catch(() => safeSet(this.setError, Translator.t('staff_statistics_page.visit_list.load_error')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
