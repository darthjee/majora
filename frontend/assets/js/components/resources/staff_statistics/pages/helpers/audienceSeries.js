const SERIES_BY_AUDIENCE = {
  all: ['anonymous', 'logged_in'],
  anonymous: ['anonymous'],
  logged_in: ['logged_in'],
};

/**
 * Resolves the anonymous / logged-in series to show for an audience filter.
 *
 * @description Shared by the Visits and Visitors tabs: `all` (and a missing or unknown
 *   audience) shows both series, `anonymous` / `logged_in` only their own.
 * @param {string} [audience] - The audience filter (`all`, `anonymous` or `logged_in`).
 * @returns {string[]} The visible series keys.
 */
export default function audienceSeries(audience) {
  return SERIES_BY_AUDIENCE[audience] || SERIES_BY_AUDIENCE.all;
}
