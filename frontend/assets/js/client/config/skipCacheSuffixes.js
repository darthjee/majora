/**
 * Set of path suffixes for which requests must always send the
 * `X-Skip-Cache: true` header.  Any request whose pathname ends with one of
 * these suffixes will have the header added automatically by `BaseClient`.
 *
 * @type {Set<string>}
 */
export default new Set([
  '/access.json',
  '/all.json',
  '/full.json',
]);
