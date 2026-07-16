/**
 * "View as" facade state for {@link AccessStore} — an optional,
 * frontend-only simulated role set (`dm`/`player`/`owner`) that, while
 * enabled, is used in place of the requester's own real identity for every
 * `*Permissions` fetch, so admins/staff can preview how a page renders for
 * a lesser-privileged user.
 *
 * @description Kept separate so this state/logic doesn't compete for line
 *   budget with the store's own fetch/cache orchestration. Never affects
 *   `*Access` identity checks nor the superuser/staff-or-superuser checks,
 *   which always resolve to the requester's real identity.
 */
export default class AccessStoreFacade {
  static #enabled = false;
  static #roles = new Set();
  static #gameSlug = null;

  /**
   * Synchronously read the current facade state, used to pre-populate the
   * facade modal when it opens.
   *
   * @returns {{enabled: boolean, roles: string[], gameSlug: (string|null)}} The current facade state.
   */
  static get() {
    return {
      enabled: AccessStoreFacade.#enabled,
      roles: Array.from(AccessStoreFacade.#roles),
      gameSlug: AccessStoreFacade.#gameSlug,
    };
  }

  /**
   * Enable/disable and configure the facade.
   *
   * @param {boolean} enabled - Whether the facade is active.
   * @param {string[]} roles - Roles to simulate while the facade is active.
   * @param {string|null} [gameSlug] - Game slug the facade is scoped to (DM
   *   activations only); `null` for an unscoped (admin/staff) facade.
   * @returns {void}
   */
  static set(enabled, roles, gameSlug = null) {
    AccessStoreFacade.#enabled = enabled;
    AccessStoreFacade.#roles = new Set(roles);
    AccessStoreFacade.#gameSlug = gameSlug;
  }

  /**
   * Resets the facade back to disabled/empty, so a new auth session never
   * inherits a stale facade from a previous session.
   *
   * @returns {void}
   */
  static clear() {
    AccessStoreFacade.#enabled = false;
    AccessStoreFacade.#roles = new Set();
    AccessStoreFacade.#gameSlug = null;
  }

  /**
   * Clears the facade when it is scoped to a `gameSlug` (a DM activation)
   * and the current route's game slug no longer strictly matches it —
   * including navigating away from any game page. Facades with no stored
   * `gameSlug` (admin/staff activations) are never touched.
   *
   * @param {string|undefined} currentGameSlug - The `gameSlug` of the route
   *   just navigated to, or `undefined` when not on a game-scoped route.
   * @returns {boolean} Whether the facade was cleared by this call.
   */
  static syncRoute(currentGameSlug) {
    if (AccessStoreFacade.#gameSlug === null) {
      return false;
    }

    if (AccessStoreFacade.#gameSlug === currentGameSlug) {
      return false;
    }

    AccessStoreFacade.clear();

    return true;
  }

  /**
   * Resolve the role set to actually request for a `*Permissions` fetch: the
   * active facade's roles when enabled and non-empty, otherwise the
   * caller-supplied roles unchanged (the real-identity path).
   *
   * @param {string[]} roles - Caller-supplied roles.
   * @returns {string[]} The effective roles to fetch/cache under.
   */
  static effectiveRoles(roles) {
    if (AccessStoreFacade.#enabled && AccessStoreFacade.#roles.size > 0) {
      return Array.from(AccessStoreFacade.#roles);
    }

    return roles;
  }
}
