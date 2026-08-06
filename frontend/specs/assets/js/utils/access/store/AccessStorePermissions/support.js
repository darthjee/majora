import AccessStoreAccess from '../../../../../../../assets/js/utils/access/store/AccessStoreAccess.js';

export const PERMISSIONS_DEFAULT = { can_edit: false };

/**
 * @description Builds a fake `Response`-shaped object for mocking the access/permissions endpoints.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
export function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

/**
 * @description Seeds the cache's game access entry directly, so a
 *   `#ensureGame`/`#getGame` call derives real roles from it synchronously.
 * @param {import('../../../../../../../assets/js/utils/access/AccessCache.js').default} cache -
 *   Shared cache instance.
 * @param {object} access - The access payload to seed the cache with.
 * @returns {Promise<void>} Resolves once the access entry is cached.
 */
export async function seedGameAccess(cache, access) {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
  gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse(access)));
  await AccessStoreAccess.ensureGame(cache, gameClient, 'demo');
}

/**
 * @description Seeds the cache's character access entry directly, so an
 *   `#ensureCharacter`/`#getCharacter` call derives real roles from it synchronously.
 * @param {import('../../../../../../../assets/js/utils/access/AccessCache.js').default} cache -
 *   Shared cache instance.
 * @param {object} access - The access payload to seed the cache with.
 * @returns {Promise<void>} Resolves once the access entry is cached.
 */
export async function seedCharacterAccess(cache, access) {
  const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterAccess']);
  characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve(fakeResponse(access)));
  await AccessStoreAccess.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');
}

/**
 * @description Seeds the cache's treasure access entry directly, so an
 *   `#ensureTreasure`/`#getTreasure` call derives real roles from it synchronously.
 * @param {import('../../../../../../../assets/js/utils/access/AccessCache.js').default} cache -
 *   Shared cache instance.
 * @param {object} access - The access payload to seed the cache with.
 * @returns {Promise<void>} Resolves once the access entry is cached.
 */
export async function seedTreasureAccess(cache, access) {
  const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasureAccess']);
  treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve(fakeResponse(access)));
  await AccessStoreAccess.ensureTreasure(cache, treasureClient, 1);
}
