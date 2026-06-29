/**
 * Set of URL path prefixes whose GET requests count as user activity.
 * Any GET request whose pathname starts with one of these prefixes will
 * trigger an activity registration in ActivityTracker.
 *
 * @type {Set<string>}
 */
export default new Set([
  '/games',
]);
