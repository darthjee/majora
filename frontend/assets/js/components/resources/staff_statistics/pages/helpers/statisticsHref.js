import { DEFAULTS } from './StatisticsFilters.js';

const KEYS = ['range', 'from', 'to', 'granularity', 'user', 'domain', 'audience'];
const CUSTOM_ONLY_KEYS = ['from', 'to'];

/**
 * Checks whether a filter entry must be written to the URL.
 *
 * @param {string} key - Filter key.
 * @param {*} value - Filter value.
 * @param {object} filters - The whole filter object.
 * @returns {boolean} `true` when the entry is not at its default.
 */
function isWritten(key, value, filters) {
  if (value === null || value === undefined || value === '') return false;
  if (CUSTOM_ONLY_KEYS.includes(key)) return filters.range === 'custom';

  return value !== DEFAULTS[key];
}

/**
 * Builds an access statistics hash URL carrying the given filters.
 *
 * @description Filters at their default (or "any") are dropped, as are `from` / `to` unless
 *   `range=custom`. Unlike `buildFilteredHref`, no `page` is added, and tab-specific params
 *   (`page`, `per_page`, `sort`) are never written, so switching tabs resets pagination and
 *   sorting.
 * @param {string} path - Tab hash path (e.g. `#/staff/statistics/visits`).
 * @param {object} filters - Statistics filters (see `StatisticsFilters.fromParams`).
 * @returns {string} `${path}?${query}`, or the bare `path` when every filter is at its default.
 */
export default function statisticsHref(path, filters) {
  const params = new URLSearchParams();

  KEYS.forEach((key) => {
    const value = filters[key];
    if (isWritten(key, value, filters)) params.set(key, value);
  });

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
