import AccessStorePermissions from '../../../../../../../assets/js/utils/access/store/AccessStorePermissions.js';
import AccessCache from '../../../../../../../assets/js/utils/access/AccessCache.js';
import AccessStoreFacade from '../../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import MajoraLogger from '../../../../../../../assets/js/utils/logging/MajoraLogger.js';
import { PERMISSIONS_DEFAULT, fakeResponse, seedGameAccess } from './support.js';

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
    it('fetches, caches, and returns the game permissions payload for an anonymous (default) access', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchGamePermissions']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({})));
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual({ can_edit: true });
      expect(AccessStorePermissions.getGame(cache, 'demo')).toEqual({ can_edit: true });
      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
      expect(gameClient.fetchGamePermissions).toHaveBeenCalledTimes(1);
    });

    it('derives the real role set from the already-cached game access entry', async function() {
      await seedGameAccess(cache, { is_dm: true, is_logged: true });

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('fires exactly one permissions fetch when access is already resolved/cached before ensureGame is called', async function() {
      await seedGameAccess(cache, { is_dm: true, is_logged: true });

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledTimes(1);
    });

    it('issues a corrected fetch when access resolves after the optimistic fetch with a different role set', async function() {
      let resolveAccess;
      const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchGamePermissions']);
      gameClient.fetchGameAccess.and.returnValue(accessPromise);
      gameClient.fetchGamePermissions.and.returnValues(
        Promise.resolve(fakeResponse({ can_edit: false })),
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const resultPromise = AccessStorePermissions.ensureGame(cache, gameClient, 'demo');
      resolveAccess(fakeResponse({ is_dm: true, is_logged: true }));
      const result = await resultPromise;

      expect(result).toEqual({ can_edit: true });
      expect(gameClient.fetchGamePermissions).toHaveBeenCalledTimes(2);
      expect(gameClient.fetchGamePermissions.calls.argsFor(0)).toEqual(['demo', null, jasmine.anything(), []]);
      expect(gameClient.fetchGamePermissions.calls.argsFor(1))
        .toEqual(['demo', null, jasmine.anything(), ['dm', 'logged']]);
    });

    it('resolves to the fail-closed default when the response is not ok', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchGamePermissions']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({})));
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(result).toEqual(PERMISSIONS_DEFAULT);
    });

    it('returns the fail-closed default for an unrequested key', function() {
      expect(AccessStorePermissions.getGame(cache, 'unknown')).toEqual(PERMISSIONS_DEFAULT);
    });

    it('requests the active facade roles (plus "logged") instead of the real roles when enabled', async function() {
      await seedGameAccess(cache, { is_player: true, is_logged: true });
      AccessStoreFacade.set(true, ['dm']);

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('requests an empty role set when the facade is enabled with "Not Logged"', async function() {
      await seedGameAccess(cache, { is_player: true, is_logged: true });
      AccessStoreFacade.set(true, [], true);

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGamePermissions']);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: false })));

      await AccessStorePermissions.ensureGame(cache, gameClient, 'demo');

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });

    it('fires exactly one permissions fetch under an active facade even when the real access resolves later ' +
      'with different real roles', async function() {
      let resolveAccess;
      const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
      AccessStoreFacade.set(true, ['dm']);
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchGamePermissions']);
      gameClient.fetchGameAccess.and.returnValue(accessPromise);
      gameClient.fetchGamePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      const resultPromise = AccessStorePermissions.ensureGame(cache, gameClient, 'demo');
      resolveAccess(fakeResponse({ is_player: true, is_logged: true }));
      await resultPromise;

      expect(gameClient.fetchGamePermissions).toHaveBeenCalledTimes(1);
      expect(gameClient.fetchGamePermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      await seedGameAccess(cache, { is_dm: true, is_logged: true });
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
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchGamePermissions']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({})));
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
});
