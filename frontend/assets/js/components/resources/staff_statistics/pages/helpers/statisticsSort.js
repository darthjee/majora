import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import statisticsHref from './statisticsHref.js';

/**
 * Builds the server-side sort helpers of a statistics tab.
 *
 * @description Each server-sorted tab (Users, Visit list) configures its own hash path, its
 *   accepted sort keys and its default sort. `sort` is not a statistics filter (it is dropped
 *   when switching tabs), so it is read straight from the hash query. The default sort is
 *   never written to the URL nor sent to the API, and `page` is never carried by a sort link,
 *   so sorting goes back to page 1.
 * @param {object} config - The tab configuration.
 * @param {string} config.path - The tab hash path (e.g. `/staff/statistics/users`).
 * @param {Array<string>} config.keys - The sort keys accepted by the tab and its API.
 * @param {string} config.defaultSort - The default sort key (one of `keys`).
 * @returns {{SORT_KEYS: Array<string>, DEFAULT_SORT: string, currentSort: Function,
 *   sortHref: Function, sortQuery: Function}} The frozen sort helpers of the tab.
 */
export function createStatisticsSort({ path, keys, defaultSort }) {
  const SORT_KEYS = Object.freeze([...keys]);
  const DEFAULT_SORT = defaultSort;

  /**
   * Reads the tab sort from the hash query.
   *
   * @description An unknown, empty or missing value falls back to the default sort.
   * @param {URLSearchParams} [params] - Hash query params (defaults to the current hash's).
   * @returns {string} One of the tab sort keys.
   */
  function currentSort(params = HashQueryParams.parse(getCurrentHash())) {
    const sort = params.get('sort');

    return SORT_KEYS.includes(sort) ? sort : DEFAULT_SORT;
  }

  /**
   * Builds the tab hash path sorted by a column.
   *
   * @description Carries the statistics filters (see `statisticsHref`) and adds `sort=<key>`,
   *   except for the default sort. `page` is never carried.
   * @param {object} filters - Statistics filters (see `StatisticsFilters.fromParams`).
   * @param {string} key - Sort key (one of the tab sort keys).
   * @returns {string} The tab hash path (without the leading `#`) with its query.
   */
  function sortHref(filters, key) {
    const href = statisticsHref(path, filters);
    if (key === DEFAULT_SORT) return href;

    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}${new URLSearchParams({ sort: key })}`;
  }

  /**
   * Builds the `sort` part of the tab API query.
   *
   * @param {string} sort - Current sort (see `currentSort`).
   * @returns {{sort?: string}} `{}` for the default sort, `{ sort }` otherwise.
   */
  function sortQuery(sort) {
    return sort === DEFAULT_SORT ? {} : { sort };
  }

  return Object.freeze({ SORT_KEYS, DEFAULT_SORT, currentSort, sortHref, sortQuery });
}

export default createStatisticsSort;
