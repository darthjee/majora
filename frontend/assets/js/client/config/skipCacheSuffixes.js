/**
 * Set of path suffixes for which requests must always send the
 * `X-Skip-Cache: true` header.  Any request whose pathname ends with one of
 * these suffixes will have the header added automatically by `BaseClient`.
 *
 * @description `/permissions.json` is intentionally not listed here: unlike
 *   `/access.json` (always user-specific, so it always skips cache), a
 *   `/permissions.json` request only skips cache when it carries no `role`
 *   query param — see `BaseClient#shouldSkipCache`, which handles that
 *   suffix's role-aware logic directly instead of through this static set.
 * @type {Set<string>}
 */
export default new Set([
  '/access.json',
  '/all.json',
  '/full.json',
]);
