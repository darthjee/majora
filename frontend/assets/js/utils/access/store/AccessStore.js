import GameClient from '../../../client/GameClient.js';
import CharacterClient from '../../../client/CharacterClient.js';
import TreasureClient from '../../../client/TreasureClient.js';
import AuthClient from '../../../client/AuthClient.js';
import accessRouteConfig from '../accessRouteConfig.js';
import AccessCache from '../AccessCache.js';
import AccessEvents from '../AccessEvents.js';
import AccessStoreDescriptor from './AccessStoreDescriptor.js';
import AccessStoreAdmin from './AccessStoreAdmin.js';
import AccessStoreAccess from './AccessStoreAccess.js';
import AccessStorePermissions from './AccessStorePermissions.js';
import AccessStoreFacade from './AccessStoreFacade.js';

const gameClient = new GameClient();
const characterClient = new CharacterClient();
const treasureClient = new TreasureClient();
const authClient = new AuthClient();
const cache = new AccessCache();

let _pageKey = null;
let _hash = '';

/**
 * Centralized, frontend-only store for access-check state (game, character,
 * treasure, and staff/superuser access), reset on every route change and
 * (re)fetched per {@link accessRouteConfig}. Delegates caching/dedup/event
 * emission to {@link AccessCache}, identity checks to {@link AccessStoreAccess},
 * and role-aware edit-permissions checks to {@link AccessStorePermissions}.
 * Owns two kinds of per-resource checks: `*Access` (identity, always the
 * requester's own real identity) and `*Permissions` (`can_edit`, for the
 * real identity or, given a role set, simulated for those roles instead —
 * cached separately per role set).
 *
 * @description Also owns the "view as" facade (state delegated to
 *   {@link AccessStoreFacade}), threaded into every `*Permissions` fetch.
 */
export default class AccessStore {
  /**
   * Resolve (or start) the identity access check for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static ensureGameAccess(gameSlug) {
    return AccessStoreAccess.ensureGame(cache, gameClient, gameSlug);
  }

  /**
   * Resolve (or start) the identity access check for a character.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static ensureCharacterAccess(characterKind, gameSlug, characterId) {
    return AccessStoreAccess.ensureCharacter(cache, characterClient, characterKind, gameSlug, characterId);
  }

  /**
   * Resolve (or start) the identity access check for a treasure.
   *
   * @param {string|number} id - Treasure id.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static ensureTreasureAccess(id) {
    return AccessStoreAccess.ensureTreasure(cache, treasureClient, id);
  }

  /**
   * Resolve (or start) the edit-permissions check for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string[]} [roles] - Roles to simulate instead of the requester's own identity.
   *   Defaults to the requester's real identity.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureGamePermissions(gameSlug, roles = []) {
    return AccessStorePermissions.ensureGame(cache, gameClient, gameSlug, roles);
  }

  /**
   * Resolve (or start) the edit-permissions check for a character.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string[]} [roles] - Roles to simulate instead of the requester's own identity.
   *   Defaults to the requester's real identity.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureCharacterPermissions(characterKind, gameSlug, characterId, roles = []) {
    return AccessStorePermissions.ensureCharacter(cache, characterClient, characterKind, gameSlug, characterId, roles);
  }

  /**
   * Resolve (or start) the edit-permissions check for a treasure.
   *
   * @param {string|number} id - Treasure id.
   * @param {string[]} [roles] - Roles to simulate instead of the requester's own identity.
   *   Defaults to the requester's real identity.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureTreasurePermissions(id, roles = []) {
    return AccessStorePermissions.ensureTreasure(cache, treasureClient, id, roles);
  }

  /**
   * Resolve (or start) the superuser check for the current user.
   *
   * @returns {Promise<boolean>} Resolves to true when the user is a superuser.
   */
  static ensureSuperUser() {
    return AccessStoreAdmin.ensureSuperUser(cache, authClient);
  }

  /**
   * Resolve (or start) the staff-or-superuser check for the current user.
   *
   * @returns {Promise<boolean>} Resolves to true when the user is staff or a superuser.
   */
  static ensureStaffOrSuperUser() {
    return AccessStoreAdmin.ensureStaffOrSuperUser(cache, authClient);
  }

  /**
   * Resolve (or start) the real (facade-independent) staff-or-superuser check
   * for the current user, used to gate the header's "view as" button. Always
   * resolves against the requester's real identity, regardless of any active
   * facade.
   *
   * @returns {Promise<boolean>} Resolves to true when the user is really staff or a superuser.
   */
  static isReallyAdminOrStaff() {
    return AccessStore.ensureStaffOrSuperUser();
  }

  /**
   * Synchronously read the currently cached game access, without triggering a fetch.
   *
   * @param {string} gameSlug - Game slug.
   * @returns {object} The cached access payload, or the fail-closed default.
   */
  static getGameAccess(gameSlug) {
    return AccessStoreAccess.getGame(cache, gameSlug);
  }

  /**
   * Synchronously read the currently cached character access, without triggering a fetch.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {object} The cached access payload, or the fail-closed default.
   */
  static getCharacterAccess(characterKind, gameSlug, characterId) {
    return AccessStoreAccess.getCharacter(cache, characterKind, gameSlug, characterId);
  }

  /**
   * Synchronously read the currently cached treasure access, without triggering a fetch.
   *
   * @param {string|number} id - Treasure id.
   * @returns {object} The cached access payload, or the fail-closed default.
   */
  static getTreasureAccess(id) {
    return AccessStoreAccess.getTreasure(cache, id);
  }

  /**
   * Synchronously read the currently cached game permissions, without triggering a fetch.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string[]} [roles] - Role set the cached lookup was made for.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getGamePermissions(gameSlug, roles = []) {
    return AccessStorePermissions.getGame(cache, gameSlug, roles);
  }

  /**
   * Synchronously read the currently cached character permissions, without triggering a fetch.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string[]} [roles] - Role set the cached lookup was made for.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getCharacterPermissions(characterKind, gameSlug, characterId, roles = []) {
    return AccessStorePermissions.getCharacter(cache, characterKind, gameSlug, characterId, roles);
  }

  /**
   * Synchronously read the currently cached treasure permissions, without triggering a fetch.
   *
   * @param {string|number} id - Treasure id.
   * @param {string[]} [roles] - Role set the cached lookup was made for.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getTreasurePermissions(id, roles = []) {
    return AccessStorePermissions.getTreasure(cache, id, roles);
  }

  /**
   * Synchronously read whether the current user is a superuser, without triggering a fetch.
   *
   * @returns {boolean} The cached result, or `false` while unresolved.
   */
  static isSuperUser() {
    return AccessStoreAdmin.isSuperUser(cache);
  }

  /**
   * Synchronously read whether the current user is staff or a superuser, without
   * triggering a fetch.
   *
   * @returns {boolean} The cached result, or `false` while unresolved.
   */
  static isStaffOrSuperUser() {
    return AccessStoreAdmin.isStaffOrSuperUser(cache);
  }

  /**
   * Synchronously read the current "view as" facade state, used to
   * pre-populate the facade modal when it opens.
   *
   * @returns {{enabled: boolean, roles: string[]}} The current facade state.
   */
  static getFacade() {
    return AccessStoreFacade.get();
  }

  /**
   * Enable/disable and configure the "view as" facade, then reset and
   * re-sync every per-resource check for the current page under the new
   * facade — naturally re-fetching each `*Permissions` check and re-emitting
   * `AccessEvents` as each resolves. Also emits `AccessEvents.emitFacadeChanged()`
   * once, so pages subscribed to it can re-run their own data-loading effect.
   *
   * @param {object} facade - The new facade state.
   * @param {boolean} facade.enabled - Whether the facade is active.
   * @param {string[]} facade.roles - Roles to simulate (`'dm'`, `'player'`, `'owner'`) while active.
   * @returns {void}
   */
  static setFacade({ enabled, roles }) {
    AccessStoreFacade.set(enabled, roles);
    AccessStore.reset();
    AccessStore.#resyncCurrentRoute();
    AccessEvents.emitFacadeChanged();
  }

  /**
   * Reset all cached/pending access state, record the current route, and
   * (re)start whichever access checks {@link accessRouteConfig} declares for it.
   *
   * @param {string} pageKey - Resolved page identifier (as returned by `HashRouteResolver#getPage`).
   * @param {string} hash - Current hash, used to extract route params.
   * @returns {void}
   */
  static syncForRoute(pageKey, hash) {
    AccessStore.reset();
    _pageKey = pageKey;
    _hash = hash;

    const descriptors = accessRouteConfig.get(pageKey);

    descriptors.forEach((descriptor) => AccessStoreDescriptor.ensure(descriptor, hash, AccessStore));
  }

  /**
   * Abort every in-flight access request, clear all cached entries, reset
   * the "view as" facade back to disabled/empty (a new auth session must not
   * inherit a stale facade from a previous session), then re-run the access
   * checks for the last-recorded route (used when the user logs in or out).
   *
   * @returns {void}
   */
  static syncForAuthChange() {
    AccessStoreFacade.clear();
    AccessStore.reset();
    AccessStore.#resyncCurrentRoute();
  }

  /**
   * Abort every in-flight access request and clear all cached entries,
   * without re-running any access check.
   *
   * @returns {void}
   */
  static reset() {
    cache.reset();
  }

  static #resyncCurrentRoute() {
    if (_pageKey !== null) {
      AccessStore.syncForRoute(_pageKey, _hash);
    }
  }
}
