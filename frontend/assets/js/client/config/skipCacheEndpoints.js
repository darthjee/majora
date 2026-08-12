/**
 * Set of endpoint pathnames (without query string) that must always send
 * the `X-Skip-Cache: true` header on requests.
 *
 * @type {Set<string>}
 */
export default new Set([
  '/ready.json',
  '/users/login.json',
  '/users/logout.json',
  '/users/status.json',
  '/users/register.json',
  '/my-games.json',
  '/account/authorization_requests.json',
  '/account/language.json',
  '/account/account.json',
]);
