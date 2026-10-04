import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import StatisticsFilters, { DEFAULTS } from './StatisticsFilters.js';

const OPTIONAL_KEYS = ['granularity', 'user', 'domain', 'audience'];

/**
 * Returns the browser's IANA time zone.
 *
 * @returns {string} The time zone name (e.g. `Europe/Lisbon`).
 */
function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Builds the API query of the access statistics endpoints from the URL filters.
 */
export default class StatisticsQuery {
  /**
   * Reads the current hash filters into an API query.
   *
   * @description Normalizes the URL filters with `StatisticsFilters.fromParams`, resolves
   *   `range` into `from` / `to` (dropping `range`), omits filters at their default or "any"
   *   (`granularity=auto`, `audience=all`, no `user` / `domain`) and adds the browser's `tz`.
   *   `from`, `to` and `tz` are always present. Controllers pass the result as
   *   `RequestStore.ensure({ ..., query: StatisticsQuery.fromHash() })`.
   * @param {HashRouteResolver} [resolver] - Hash resolver to read the filters from.
   * @param {string} [today] - Today as `YYYY-MM-DD` (defaults to the browser's local date).
   * @param {string} [tz] - IANA time zone (defaults to the browser's zone).
   * @returns {{from: string, to: string, tz: string, granularity?: string, user?: string,
   *   domain?: string, audience?: string}} The API query.
   */
  static fromHash(resolver = new HashRouteResolver(), today = StatisticsFilters.today(), tz = browserTimeZone()) {
    const filters = StatisticsFilters.fromParams(resolver.getFilterParams());
    const query = { ...StatisticsFilters.resolveDates(filters, today), tz };

    OPTIONAL_KEYS.forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== DEFAULTS[key]) query[key] = value;
    });

    return query;
  }
}
