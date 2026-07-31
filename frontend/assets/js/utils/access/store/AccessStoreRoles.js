const ROLE_FLAGS = [
  ['is_superuser', 'superuser'],
  ['is_staff', 'staff'],
  ['is_dm', 'dm'],
  ['is_player', 'player'],
  ['is_owner', 'owner'],
  ['is_logged', 'logged'],
];

/**
 * Derives the backend's `?role=` vocabulary (`superuser`, `staff`, `dm`,
 * `player`, `owner`, `logged`) from an `*Access` payload's booleans, kept
 * separate so this small, pure mapping doesn't clutter the store's own
 * fetch/cache orchestration.
 */
export default class AccessStoreRoles {
  /**
   * Map an access payload's boolean flags to the role names the backend's
   * `permissions.json?role=` recognizes, including only the truthy ones
   * (`null`, e.g. an unauthenticated `is_superuser`, is treated as falsy).
   *
   * @param {object} access - An `*Access` payload (see {@link AccessStoreAccess}).
   * @returns {string[]} The role names applicable to this payload.
   */
  static fromAccess(access) {
    return ROLE_FLAGS
      .filter(([flag]) => Boolean(access?.[flag]))
      .map(([, role]) => role);
  }
}
