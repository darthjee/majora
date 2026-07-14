import AccessStoreAccess from '../../../../../../assets/js/utils/access/store/AccessStoreAccess.js';
import AccessCache from '../../../../../../assets/js/utils/access/AccessCache.js';
import MajoraLogger from '../../../../../../assets/js/utils/logging/MajoraLogger.js';

const ACCESS_DEFAULT = {
  username: null,
  is_superuser: null,
  is_staff: null,
  is_dm: null,
  is_player: false,
  is_owner: false,
};

/**
 * @description Builds a fake `Response`-shaped object for mocking the access endpoints.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('AccessStoreAccess', function() {
  let cache;

  beforeEach(function() {
    cache = new AccessCache();
  });

  describe('#ensureGame / #getGame', function() {
    it('fetches, caches, and returns the game access payload', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({ username: 'gm' })));

      const result = await AccessStoreAccess.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual({ username: 'gm' });
      expect(AccessStoreAccess.getGame(cache, 'demo')).toEqual({ username: 'gm' });
    });

    it('resolves to the fail-closed default when the response is not ok', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStoreAccess.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual(ACCESS_DEFAULT);
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStoreAccess.getGame(cache, 'unknown')).toEqual(ACCESS_DEFAULT);
    });

    it('logs the request and result at debug level via MajoraLogger', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({ username: 'gm' })));

      await AccessStoreAccess.ensureGame(cache, gameClient, 'demo');

      expect(debugSpy).toHaveBeenCalledWith({ method: 'ensureGame', args: ['demo'], result: { username: 'gm' } });
    });

    it('logs the failure at debug level without altering the fail-closed result', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStoreAccess.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual(ACCESS_DEFAULT);
      expect(debugSpy).toHaveBeenCalledWith({ method: 'ensureGame', args: ['demo'], error: jasmine.any(Error) });
    });
  });

  describe('#ensureCharacter / #getCharacter', function() {
    it('fetches, caches, and returns the character access payload', async function() {
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterAccess']);
      characterClient.fetchCharacterAccess.and.returnValue(
        Promise.resolve(fakeResponse({ username: 'pc' })),
      );

      const result = await AccessStoreAccess.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');

      expect(result).toEqual({ username: 'pc' });
      expect(AccessStoreAccess.getCharacter(cache, 'pcs', 'demo', '2')).toEqual({ username: 'pc' });
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStoreAccess.getCharacter(cache, 'pcs', 'demo', '2')).toEqual(ACCESS_DEFAULT);
    });

    it('logs the request and result at debug level via MajoraLogger', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterAccess']);
      characterClient.fetchCharacterAccess.and.returnValue(
        Promise.resolve(fakeResponse({ username: 'pc' })),
      );

      await AccessStoreAccess.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureCharacter',
        args: ['pcs', 'demo', '2'],
        result: { username: 'pc' },
      });
    });
  });

  describe('#ensureTreasure / #getTreasure', function() {
    it('fetches, caches, and returns the treasure access payload', async function() {
      const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasureAccess']);
      treasureClient.fetchTreasureAccess.and.returnValue(
        Promise.resolve(fakeResponse({ username: 'owner' })),
      );

      const result = await AccessStoreAccess.ensureTreasure(cache, treasureClient, 1);

      expect(result).toEqual({ username: 'owner' });
      expect(AccessStoreAccess.getTreasure(cache, 1)).toEqual({ username: 'owner' });
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStoreAccess.getTreasure(cache, 1)).toEqual(ACCESS_DEFAULT);
    });

    it('logs the request and result at debug level via MajoraLogger', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasureAccess']);
      treasureClient.fetchTreasureAccess.and.returnValue(
        Promise.resolve(fakeResponse({ username: 'owner' })),
      );

      await AccessStoreAccess.ensureTreasure(cache, treasureClient, 1);

      expect(debugSpy).toHaveBeenCalledWith({ method: 'ensureTreasure', args: [1], result: { username: 'owner' } });
    });
  });
});
