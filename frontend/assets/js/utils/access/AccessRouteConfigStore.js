import AccessRouteConfigClient from '../../client/AccessRouteConfigClient.js';
import Noop from '../Noop.js';

const client = new AccessRouteConfigClient();

/**
 * Fallback page → resource-kind mapping, matching this app's pre-existing
 * hardcoded values (before this config moved to the backend). Used until the
 * backend's `/access-route-config.json` has loaded — or indefinitely if it
 * fails to load — so behavior never regresses while the one-time boot fetch
 * is in flight.
 *
 * @description Pages whose only access check is a fixed identity fact
 *   (`superuser`/`staffOrSuperuser`) have no entry here: `accessRouteConfig.js`
 *   keeps those hardcoded as literals, since they never varied per resource
 *   in the first place (see that file's module doc).
 * @type {object}
 */
const FALLBACK_KINDS = {
  game: { kind: 'game' },
  gameEdit: { kind: 'game' },
  gameNpcs: { kind: 'game' },
  gamePhotos: { kind: 'game' },
  gameTasks: { kind: 'game' },
  gamePolls: { kind: 'game' },
  gamePoll: { kind: 'game' },
  gameTreasures: { kind: 'game' },
  gameSessions: { kind: 'game' },
  gameNpcNew: { kind: 'game' },
  gamePollNew: { kind: 'game' },
  gameSessionNew: { kind: 'game' },
  gameTreasureNew: { kind: 'game' },
  gameTreasureEdit: { kind: 'game' },
  pcCharacter: { kind: 'character', characterKind: 'pcs' },
  npcCharacter: { kind: 'character', characterKind: 'npcs' },
  pcCharacterEdit: { kind: 'character', characterKind: 'pcs' },
  npcCharacterEdit: { kind: 'character', characterKind: 'npcs' },
  pcCharacterPhotos: { kind: 'character', characterKind: 'pcs' },
  npcCharacterPhotos: { kind: 'character', characterKind: 'npcs' },
  pcCharacterTreasures: { kind: 'character', characterKind: 'pcs' },
  npcCharacterTreasures: { kind: 'character', characterKind: 'npcs' },
  treasure: { kind: 'treasure' },
  treasureEdit: { kind: 'treasure' },
};

/**
 * `kind` values that identify a resource-kind descriptor (as opposed to a
 * fixed-identity descriptor such as `superuser`/`staffOrSuperuser`, which
 * `accessRouteConfig.js` already handles as hardcoded literals and never
 * looks up here).
 *
 * @type {string[]}
 */
const RESOURCE_KINDS = ['game', 'character', 'treasure'];

let _kinds = { ...FALLBACK_KINDS };
let _loadPromise = null;

/**
 * In-memory cache of the backend's page → resource-kind config
 * (`GET /access-route-config.json`), fetched once (at app boot) and reused
 * for the lifetime of the page. See `accessRouteConfig.js` for how the
 * cached kinds are consumed.
 */
export default class AccessRouteConfigStore {
  /**
   * Fetch (once) and cache the backend's resource-kind config. Safe to call
   * more than once — later calls return the same, already in-flight/settled
   * promise instead of re-fetching.
   *
   * @returns {Promise<void>} Resolves once the fetch settles (success or failure).
   */
  static load() {
    if (!_loadPromise) {
      _loadPromise = client.fetchAccessRouteConfig()
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => AccessRouteConfigStore.#apply(data))
        .catch(Noop.noop);
    }

    return _loadPromise;
  }

  /**
   * Synchronously read the resource kind resolved for a page.
   *
   * @param {string} pageKey - Resolved page identifier.
   * @returns {{kind: string, characterKind: (string|undefined)}|undefined} The resolved
   *   resource kind, or `undefined` for a page with no resource-kind mapping.
   */
  static getKind(pageKey) {
    return _kinds[pageKey];
  }

  /**
   * Reset the cache to its fallback values and forget any in-flight or
   * completed fetch (test-only helper).
   *
   * @returns {void}
   */
  static reset() {
    _kinds = { ...FALLBACK_KINDS };
    _loadPromise = null;
  }

  static #apply(data) {
    if (data && typeof data === 'object') {
      _kinds = { ...FALLBACK_KINDS, ...AccessRouteConfigStore.#normalize(data) };
    }
  }

  /**
   * Normalize the backend's `{ pageKey: descriptor[] }` response into this
   * store's `{ pageKey: descriptor }` shape, keeping — for each page — only
   * the single descriptor whose `kind` is a resource kind (`game`,
   * `character`, or `treasure`), and dropping fixed-identity descriptors
   * (`superuser`/`staffOrSuperuser`) and page keys with no resource-kind
   * descriptor at all.
   *
   * @param {object} data - Raw `{ pageKey: descriptor[] }` response body.
   * @returns {object} `{ pageKey: descriptor }` map, resource-kind entries only.
   */
  static #normalize(data) {
    return Object.fromEntries(
      Object.entries(data)
        .map(([pageKey, descriptors]) => [pageKey, AccessRouteConfigStore.#resourceKind(descriptors)])
        .filter(([, descriptor]) => descriptor !== undefined),
    );
  }

  /**
   * Pick the resource-kind descriptor out of a page's list of descriptors.
   *
   * @param {object[]} descriptors - A page's list of descriptor dicts.
   * @returns {{kind: string, characterKind: (string|undefined)}|undefined} The
   *   resource-kind descriptor, or `undefined` when none is present.
   */
  static #resourceKind(descriptors) {
    if (!Array.isArray(descriptors)) {
      return undefined;
    }

    return descriptors.find((descriptor) => RESOURCE_KINDS.includes(descriptor?.kind));
  }
}
