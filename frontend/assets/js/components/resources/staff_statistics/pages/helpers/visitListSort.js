import { createStatisticsSort } from './statisticsSort.js';

const visitListSort = createStatisticsSort({
  path: '/staff/statistics/visit-list',
  keys: ['started_at', 'last_seen', 'duration', 'hits'],
  defaultSort: 'started_at',
});

/**
 * Sort keys accepted by the Visit list tab `sort` URL param (and by the API).
 *
 * @type {Array<string>}
 */
export const SORT_KEYS = visitListSort.SORT_KEYS;

/**
 * The Visit list tab default sort, never written to the URL nor sent to the API.
 *
 * @type {string}
 */
export const DEFAULT_SORT = visitListSort.DEFAULT_SORT;

/**
 * Reads the Visit list tab sort from the hash query (issue #1523).
 *
 * @type {Function}
 */
export const currentSort = visitListSort.currentSort;

/**
 * Builds the Visit list tab hash path sorted by a column (`page` is never carried).
 *
 * @type {Function}
 */
export const sortHref = visitListSort.sortHref;

/**
 * Builds the `sort` part of the Visit list API query.
 *
 * @type {Function}
 */
export const sortQuery = visitListSort.sortQuery;
