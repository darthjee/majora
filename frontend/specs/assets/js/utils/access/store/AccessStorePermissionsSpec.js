import AccessStorePermissions from '../../../../../../assets/js/utils/access/store/AccessStorePermissions.js';
import AccessCache from '../../../../../../assets/js/utils/access/AccessCache.js';
import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import MajoraLogger from '../../../../../../assets/js/utils/logging/MajoraLogger.js';

const PERMISSIONS_DEFAULT = { can_edit: false };

/**
 * @description Builds a fake `Response`-shaped object for mocking the permissions endpoints.
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

  describe('#ensureGame / #getGame', function() {
    it('fetches, caches, and returns the game permissions payload', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo', []);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getGame(cache, 'demo', [])).toEqual({ can_edit: true });
      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });

    it('resolves to the fail-closed default when the response is not ok', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo', []);

      expect(result).toEqual(PERMISSIONS_DEFAULT);
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getGame(cache, 'unknown', [])).toEqual(PERMISSIONS_DEFAULT);
    });

    it('requests the active facade roles instead of the caller-supplied roles when enabled', async function() {
      AccessStoreFacade.set(true, ['dm']);

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo', ['player']);

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm']);
    });

    it('logs the request, real roles, effective roles, and result at debug level', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo', ['player']);

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo', ['player']],
        roles: ['player'],
        effectiveRoles: ['player'],
        result: { can_edit: true },
      });
    });

    it('logs the effective (simulated) roles as distinct from the real roles when the facade is active', async function() {
      AccessStoreFacade.set(true, ['dm']);
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo', ['player']);

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo', ['player']],
        roles: ['player'],
        effectiveRoles: ['dm'],
        result: { can_edit: true },
      });
    });

    it('logs the failure at debug level without altering the fail-closed result', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo', ['player']);

      expect(result).toEqual(PERMISSIONS_DEFAULT);
      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo', ['player']],
        roles: ['player'],
        effectiveRoles: ['player'],
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

      const result = await AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2', []);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getCharacter(cache, 'pcs', 'demo', '2', [])).toEqual({ can_edit: true });
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getCharacter(cache, 'pcs', 'demo', '2', [])).toEqual(PERMISSIONS_DEFAULT);
    });

    it('logs the request, real/effective roles, and result at debug level', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterPermissions']);
      characterClient.fetchCharacterPermissions.and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2', ['player']);

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureCharacter',
        args: ['pcs', 'demo', '2', ['player']],
        roles: ['player'],
        effectiveRoles: ['player'],
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

      const result = await AccessStorePermissions.ensureTreasure(cache, treasureClient, 1, []);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getTreasure(cache, 1, [])).toEqual({ can_edit: true });
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getTreasure(cache, 1, [])).toEqual(PERMISSIONS_DEFAULT);
    });

    it('logs the request, real/effective roles, and result at debug level', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasurePermissions']);
      treasureClient.fetchTreasurePermissions.and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStorePermissions.ensureTreasure(cache, treasureClient, 1, ['player']);

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureTreasure',
        args: [1, ['player']],
        roles: ['player'],
        effectiveRoles: ['player'],
        result: { can_edit: true },
      });
    });
  });
});
