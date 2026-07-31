import AccessStorePermissions from '../../../../../../assets/js/utils/access/store/AccessStorePermissions.js';
import AccessStoreAccess from '../../../../../../assets/js/utils/access/store/AccessStoreAccess.js';
import AccessCache from '../../../../../../assets/js/utils/access/AccessCache.js';
import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import MajoraLogger from '../../../../../../assets/js/utils/logging/MajoraLogger.js';

const PERMISSIONS_DEFAULT = { can_edit: false };

/**
 * @description Builds a fake `Response`-shaped object for mocking the access/permissions endpoints.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('AccessStorePermissions', function() {
  let cache;

  beforeEach(function() {
    cache = new AccessCache();
    AccessStoreFacade.clear();
  });

  afterEach(function() {
    AccessStoreFacade.clear();
  });

  /**
   * @description Seeds the cache's game access entry directly, so a
   *   `#ensureGame`/`#getGame` call derives real roles from it synchronously.
   * @param {object} access - The access payload to seed the cache with.
   * @returns {Promise<void>} Resolves once the access entry is cached.
   */
  async function seedGameAccess(access) {
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse(access)));
    await AccessStoreAccess.ensureGame(cache, gameClient, 'demo');
  }

  describe('#ensureGame / #getGame', function() {
    it('fetches, caches, and returns the game permissions payload for an anonymous (default) access', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getGame(cache, 'demo')).toEqual({ can_edit: true });
      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });

    it('derives the real role set from the already-cached game access entry', async function() {
      await seedGameAccess({ is_dm: true, is_logged: true });

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('resolves to the fail-closed default when the response is not ok', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual(PERMISSIONS_DEFAULT);
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getGame(cache, 'unknown')).toEqual(PERMISSIONS_DEFAULT);
    });

    it('requests the active facade roles (plus "logged") instead of the real roles when enabled', async function() {
      await seedGameAccess({ is_player: true, is_logged: true });
      AccessStoreFacade.set(true, ['dm']);

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('requests an empty role set when the facade is enabled with "Not Logged"', async function() {
      await seedGameAccess({ is_player: true, is_logged: true });
      AccessStoreFacade.set(true, [], true);

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: false })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      await seedGameAccess({ is_dm: true, is_logged: true });
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo'],
        roleSet: ['dm', 'logged'],
        result: { can_edit: true },
      });
    });

    it('logs the failure at debug level without altering the fail-closed result', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual(PERMISSIONS_DEFAULT);
      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo'],
        roleSet: [],
        error: jasmine.any(Error),
      });
    });
  });

  describe('#ensureCharacter / #getCharacter', function() {
    it('fetches, caches, and returns the character permissions payload', async function() {
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterPermissions']);
      characterClient.fetchCharacterPermissions.and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getCharacter(cache, 'pcs', 'demo', '2')).toEqual({ can_edit: true });
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getCharacter(cache, 'pcs', 'demo', '2')).toEqual(PERMISSIONS_DEFAULT);
    });

    it('derives the real role set from the already-cached character access entry', async function() {
      const characterClient = jasmine.createSpyObj(
        'characterClient', ['fetchCharacterAccess', 'fetchCharacterPermissions'],
      );
      characterClient.fetchCharacterAccess.and.returnValue(
        Promise.resolve(fakeResponse({ is_owner: true, is_logged: true })),
      );
      characterClient.fetchCharacterPermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStoreAccess.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');
      await AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');

      expect(characterClient.fetchCharacterPermissions).toHaveBeenCalledWith(
        'pcs', 'demo', '2', null, jasmine.anything(), ['logged', 'owner'],
      );
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterPermissions']);
      characterClient.fetchCharacterPermissions.and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureCharacter',
        args: ['pcs', 'demo', '2'],
        roleSet: [],
        result: { can_edit: true },
      });
    });
  });

  describe('#ensureTreasure / #getTreasure', function() {
    it('fetches, caches, and returns the treasure permissions payload', async function() {
      const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasurePermissions']);
      treasureClient.fetchTreasurePermissions.and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStorePermissions.ensureTreasure(cache, treasureClient, 1);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getTreasure(cache, 1)).toEqual({ can_edit: true });
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getTreasure(cache, 1)).toEqual(PERMISSIONS_DEFAULT);
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasurePermissions']);
      treasureClient.fetchTreasurePermissions.and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStorePermissions.ensureTreasure(cache, treasureClient, 1);

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureTreasure',
        args: [1],
        roleSet: [],
        result: { can_edit: true },
      });
    });
  });
});
