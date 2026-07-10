import GameClient from '../client/GameClient.js';
import CharacterClient from '../client/CharacterClient.js';
import TreasureClient from '../client/TreasureClient.js';
import AuthClient from '../client/AuthClient.js';
import AuthStorage from './AuthStorage.js';
import AccessEvents from './AccessEvents.js';
import Router from './Router.js';
import accessRouteConfig from './accessRouteConfig.js';

const RESOURCE_DEFAULT = { can_edit: false };
const ADMIN_DEFAULT = false;
const SUPERUSER_KEY = 'admin:superuser';
const STAFF_KEY = 'admin:staff';

const gameClient = new GameClient();
const characterClient = new CharacterClient();
const treasureClient = new TreasureClient();
const authClient = new AuthClient();

/**
 * In-memory cache of access-check results, keyed by a deterministic string
 * built from the access kind and its identity (see the `#*Key` helpers).
 * Reset on every route change and rebuilt on every auth change.
 *
 * @type {Map<string, {status: string, data: *, promise: Promise<*>, controller: AbortController}>}
 */
let _cache = new Map();

let _pageKey = null;
let _hash = '';

/**
 * Centralized, frontend-only store for access-check state (game, character,
 * treasure, and staff/superuser access), reset on every route change and
 * (re)fetched per {@link accessRouteConfig}. Emits {@link AccessEvents} when
 * a request finishes, so other parts of the app can react without polling.
 */
export default class AccessStore {
  /**
   * Resolve (or start) the access check for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the access payload.
   */
  static ensureGameAccess(gameSlug) {
    return AccessStore.#ensure(
      AccessStore.#gameKey(gameSlug),
      (signal) => gameClient.fetchGameAccess(gameSlug, AuthStorage.getToken(), signal)
        .then(AccessStore.#parseResourceResponse),
      RESOURCE_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the access check for a character.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the access payload.
   */
  static ensureCharacterAccess(characterKind, gameSlug, characterId) {
    return AccessStore.#ensure(
      AccessStore.#characterKey(characterKind, gameSlug, characterId),
      (signal) => characterClient
        .fetchCharacterAccess(characterKind, gameSlug, characterId, AuthStorage.getToken(), signal)
        .then(AccessStore.#parseResourceResponse),
      RESOURCE_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the access check for a treasure.
   *
   * @param {string|number} id - Treasure id.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the access payload.
   */
  static ensureTreasureAccess(id) {
    return AccessStore.#ensure(
      AccessStore.#treasureKey(id),
      (signal) => treasureClient.fetchTreasureAccess(id, AuthStorage.getToken(), signal)
        .then(AccessStore.#parseResourceResponse),
      RESOURCE_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the superuser check for the current user.
   *
   * @returns {Promise<boolean>} Resolves to true when the user is a superuser.
   */
  static ensureSuperUser() {
    return AccessStore.#ensure(
      SUPERUSER_KEY,
      (signal) => authClient.status(AuthStorage.getToken(), signal)
        .then((response) => AccessStore.#parseStatusResponse(response, (data) => Boolean(data.is_superuser))),
      ADMIN_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the staff-or-superuser check for the current user.
   *
   * @returns {Promise<boolean>} Resolves to true when the user is staff or a superuser.
   */
  static ensureStaffOrSuperUser() {
    return AccessStore.#ensure(
      STAFF_KEY,
      (signal) => authClient.status(AuthStorage.getToken(), signal).then((response) => AccessStore
        .#parseStatusResponse(response, (data) => Boolean(data.is_superuser) || Boolean(data.is_staff))),
      ADMIN_DEFAULT,
    );
  }

  /**
   * Synchronously read the currently cached game access, without triggering a fetch.
   *
   * @param {string} gameSlug - Game slug.
   * @returns {{can_edit: boolean}} The cached access payload, or the fail-closed default.
   */
  static getGameAccess(gameSlug) {
    return AccessStore.#read(AccessStore.#gameKey(gameSlug), RESOURCE_DEFAULT);
  }

  /**
   * Synchronously read the currently cached character access, without triggering a fetch.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {{can_edit: boolean}} The cached access payload, or the fail-closed default.
   */
  static getCharacterAccess(characterKind, gameSlug, characterId) {
    return AccessStore.#read(AccessStore.#characterKey(characterKind, gameSlug, characterId), RESOURCE_DEFAULT);
  }

  /**
   * Synchronously read the currently cached treasure access, without triggering a fetch.
   *
   * @param {string|number} id - Treasure id.
   * @returns {{can_edit: boolean}} The cached access payload, or the fail-closed default.
   */
  static getTreasureAccess(id) {
    return AccessStore.#read(AccessStore.#treasureKey(id), RESOURCE_DEFAULT);
  }

  /**
   * Synchronously read whether the current user is a superuser, without triggering a fetch.
   *
   * @returns {boolean} The cached result, or `false` while unresolved.
   */
  static isSuperUser() {
    return AccessStore.#read(SUPERUSER_KEY, ADMIN_DEFAULT);
  }

  /**
   * Synchronously read whether the current user is staff or a superuser, without
   * triggering a fetch.
   *
   * @returns {boolean} The cached result, or `false` while unresolved.
   */
  static isStaffOrSuperUser() {
    return AccessStore.#read(STAFF_KEY, ADMIN_DEFAULT);
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

    const descriptors = accessRouteConfig[pageKey] ?? [];

    descriptors.forEach((descriptor) => AccessStore.#ensureFromDescriptor(descriptor, hash));
  }

  /**
   * Abort every in-flight access request, clear all cached entries, then
   * re-run the access checks for the last-recorded route (used when the
   * user logs in or out).
   *
   * @returns {void}
   */
  static syncForAuthChange() {
    AccessStore.reset();

    if (_pageKey !== null) {
      AccessStore.syncForRoute(_pageKey, _hash);
    }
  }

  /**
   * Abort every in-flight access request and clear all cached entries,
   * without re-running any access check.
   *
   * @returns {void}
   */
  static reset() {
    _cache.forEach((entry) => entry.controller.abort());
    _cache = new Map();
  }

  static #ensureFromDescriptor(descriptor, hash) {
    if (descriptor.kind === 'superuser') {
      return AccessStore.ensureSuperUser();
    }

    if (descriptor.kind === 'staffOrSuperuser') {
      return AccessStore.ensureStaffOrSuperUser();
    }

    const params = Router.extractParams(descriptor.pattern, hash);

    if (descriptor.kind === 'game') {
      return AccessStore.ensureGameAccess(params[descriptor.params[0]]);
    }

    if (descriptor.kind === 'treasure') {
      return AccessStore.ensureTreasureAccess(params[descriptor.params[0]]);
    }

    return AccessStore.ensureCharacterAccess(
      descriptor.characterKind, params.game_slug, params.character_id,
    );
  }

  static #parseResourceResponse(response) {
    if (!response.ok) {
      return Promise.reject(new Error('access request failed'));
    }

    return response.json();
  }

  static #parseStatusResponse(response, extract) {
    if (!response.ok) {
      return Promise.reject(new Error('status request failed'));
    }

    return response.json().then(extract);
  }

  static #gameKey(gameSlug) {
    return `game:${gameSlug}`;
  }

  static #characterKey(characterKind, gameSlug, characterId) {
    return `character:${characterKind}:${gameSlug}:${characterId}`;
  }

  static #treasureKey(id) {
    return `treasure:${id}`;
  }

  static #read(key, defaultValue) {
    const entry = _cache.get(key);

    if (!entry || entry.status !== 'ready') {
      return defaultValue;
    }

    return entry.data;
  }

  static #ensure(key, fetcher, defaultValue) {
    const cached = _cache.get(key);

    if (cached) {
      return cached.status === 'ready' ? Promise.resolve(cached.data) : cached.promise;
    }

    const controller = new AbortController();
    const promise = fetcher(controller.signal)
      .then((data) => AccessStore.#settle(key, controller, promise, data))
      .catch((error) => AccessStore.#fail(key, controller, promise, defaultValue, error));

    _cache.set(key, { status: 'pending', data: undefined, promise, controller });
    return promise;
  }

  static #settle(key, controller, promise, data) {
    if (_cache.get(key)?.controller !== controller) {
      return data;
    }

    _cache.set(key, { status: 'ready', data, promise, controller });
    AccessEvents.emit({ key });
    return data;
  }

  static #fail(key, controller, promise, defaultValue, error) {
    if (_cache.get(key)?.controller !== controller) {
      return defaultValue;
    }

    if (error?.name === 'AbortError') {
      _cache.delete(key);
      return defaultValue;
    }

    _cache.set(key, { status: 'ready', data: defaultValue, promise, controller });
    AccessEvents.emit({ key });
    return defaultValue;
  }
}
