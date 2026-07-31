/**
 * "View as" facade state for {@link AccessStore} — an optional,
 * frontend-only simulated role set (`dm`/`player`/`owner`, plus a "Not
 * Logged" mock) that, while enabled, is used in place of the requester's
 * own real identity for every `*Permissions` fetch, so admins/staff can
 * preview how a page renders for a lesser-privileged (or anonymous) user.
 *
 * @description Kept separate so this state/logic doesn't compete for line
 *   budget with the store's own fetch/cache orchestration. Never affects
 *   `*Access` identity checks nor the superuser/staff-or-superuser checks,
 *   which always resolve to the requester's real identity.
 */
export default class AccessStoreFacade {
  static #enabled = false;
  static #roles = new Set();
  static #notLogged = false;
  static #gameSlug = null;

  /**
   * Synchronously read the current facade state, used to pre-populate the
   * facade modal when it opens.
   *
   * @returns {{enabled: boolean, roles: string[], notLogged: boolean,
   *   gameSlug: (string|null)}} The current facade state.
   */
  static get() {
    return {
      enabled: AccessStoreFacade.#enabled,
      roles: Array.from(AccessStoreFacade.#roles),
      notLogged: AccessStoreFacade.#notLogged,
      gameSlug: AccessStoreFacade.#gameSlug,
    };
  }

  /**
   * Enable/disable and configure the facade.
   *
   * @param {boolean} enabled - Whether the facade is active.
   * @param {string[]} roles - Roles to simulate while the facade is active.
   * @param {boolean} [notLogged] - When `true` (and `enabled`), simulate an
   *   anonymous (not logged in) requester instead of the selected roles.
   * @param {string|null} [gameSlug] - Game slug the facade is scoped to (DM
   *   activations only); `null` for an unscoped (admin/staff) facade.
   * @returns {void}
   */
  static set(enabled, roles, notLogged = false, gameSlug = null) {
    AccessStoreFacade.#enabled = enabled;
    AccessStoreFacade.#roles = new Set(roles);
    AccessStoreFacade.#notLogged = notLogged;
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
    AccessStoreFacade.#notLogged = false;
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
   * Resolve the role set to actually request for a `*Permissions` fetch:
   * the caller's real (derived) roles when the facade is disabled;
   * an explicit empty set (anonymous) when the facade is enabled with "Not
   * Logged" on; otherwise the facade's own simulated roles plus `'logged'`
   * (a mock is always simulating a logged-in user unless "Not Logged" is set).
   *
   * @param {string[]} realRoles - The caller's real, derived roles (see
   *   {@link AccessStoreRoles.fromAccess}), used unchanged when the facade
   *   is disabled.
   * @returns {string[]} The effective roles to fetch/cache under.
   */
  static rolesForPermissionsRequest(realRoles) {
    if (!AccessStoreFacade.#enabled) {
      return realRoles;
    }

    if (AccessStoreFacade.#notLogged) {
      return [];
    }

    return [...Array.from(AccessStoreFacade.#roles), 'logged'];
  }
}
