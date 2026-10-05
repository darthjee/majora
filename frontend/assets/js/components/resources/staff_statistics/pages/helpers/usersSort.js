import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import statisticsHref from './statisticsHref.js';

/**
 * Sort keys accepted by the Users tab `sort` URL param (and by the API).
 *
 * @type {Array<string>}
 */
export const SORT_KEYS = Object.freeze(['visits', 'time_on_site', 'average_duration', 'hits', 'last_seen']);

/**
 * The Users tab default sort, never written to the URL nor sent to the API.
 *
 * @type {string}
 */
export const DEFAULT_SORT = 'visits';

const USERS_PATH = '/staff/statistics/users';

/**
 * Reads the Users tab sort from the hash query (issue #1520).
 *
 * @description `sort` is not a statistics filter (it is dropped when switching tabs), so it
 *   is read straight from the hash query. An unknown, empty or missing value falls back to
 *   {@link DEFAULT_SORT}.
 * @param {URLSearchParams} [params] - Hash query params (defaults to the current hash's).
 * @returns {string} One of {@link SORT_KEYS}.
 */
export function currentSort(params = HashQueryParams.parse(getCurrentHash())) {
  const sort = params.get('sort');

  return SORT_KEYS.includes(sort) ? sort : DEFAULT_SORT;
}

/**
 * Builds the Users tab hash path sorted by a column.
 *
 * @description Carries the statistics filters (see `statisticsHref`) and adds `sort=<key>`,
 *   except for {@link DEFAULT_SORT}. `page` is never carried, so sorting goes back to page 1.
 * @param {object} filters - Statistics filters (see `StatisticsFilters.fromParams`).
 * @param {string} key - Sort key (one of {@link SORT_KEYS}).
 * @returns {string} The Users tab hash path (without the leading `#`) with its query.
 */
export function sortHref(filters, key) {
  const href = statisticsHref(USERS_PATH, filters);
  if (key === DEFAULT_SORT) return href;

  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}${new URLSearchParams({ sort: key })}`;
}

/**
 * Builds the `sort` part of the Users API query.
 *
 * @param {string} sort - Current sort (see {@link currentSort}).
 * @returns {{sort?: string}} `{}` for the default sort, `{ sort }` otherwise.
 */
export function sortQuery(sort) {
  return sort === DEFAULT_SORT ? {} : { sort };
}
