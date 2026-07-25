/**
 * Set of endpoint pathname prefixes that must always send the
 * `X-Skip-Cache: true` header on GET requests, for endpoints whose full
 * pathname can't be expressed via `skipCacheEndpoints.js`'s exact-match Set
 * (a fixed path) or `skipCacheSuffixes.js`'s suffix-match Set (a fixed
 * trailing segment) — namely a dynamic `uuid` path segment sitting
 * immediately before `.json`.
 *
 * @type {Set<string>}
 */
export default new Set([
  // The polling endpoint for a device-authorization login request
  // (`/users/authorization_requests/<uuid>.json`) is user-specific,
  // bearer-token-gated data, so a cached response must never be served to
  // another client.
  '/users/authorization_requests/',
]);
