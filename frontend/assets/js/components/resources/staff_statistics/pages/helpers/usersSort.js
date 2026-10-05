import { createStatisticsSort } from './statisticsSort.js';

const usersSort = createStatisticsSort({
  path: '/staff/statistics/users',
  keys: ['visits', 'time_on_site', 'average_duration', 'hits', 'last_seen'],
  defaultSort: 'visits',
});

/**
 * Sort keys accepted by the Users tab `sort` URL param (and by the API).
 *
 * @type {Array<string>}
 */
export const SORT_KEYS = usersSort.SORT_KEYS;

/**
 * The Users tab default sort, never written to the URL nor sent to the API.
 *
 * @type {string}
 */
export const DEFAULT_SORT = usersSort.DEFAULT_SORT;

/**
 * Reads the Users tab sort from the hash query (issue #1520).
 *
 * @type {Function}
 */
export const currentSort = usersSort.currentSort;

/**
 * Builds the Users tab hash path sorted by a column (`page` is never carried).
 *
 * @type {Function}
 */
export const sortHref = usersSort.sortHref;

/**
 * Builds the `sort` part of the Users API query.
 *
 * @type {Function}
 */
export const sortQuery = usersSort.sortQuery;
