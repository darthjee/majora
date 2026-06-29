/**
 * Set of endpoint pathnames (without query string) that must always send
 * the `X-Skip-Cache: 1` header on requests.
 *
 * @type {Set<string>}
 */
export default new Set([
  '/health.json',
  '/users/login.json',
  '/users/logout.json',
  '/users/status.json',
  '/users/language.json',
  '/users/register.json',
]);
