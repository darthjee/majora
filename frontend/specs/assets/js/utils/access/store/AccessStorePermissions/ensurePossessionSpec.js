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

  describe('#ensurePossession', function() {
    it('fetches, caches, and returns the possession permissions payload for an anonymous (default) access',
      async function() {
        const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchPossessionPermissions']);
        gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({})));
        gameClient.fetchPossessionPermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

        const result = await AccessStorePermissions.ensurePossession(cache, gameClient, 'demo');

        expect(result).toEqual({ can_edit: true });
        expect(gameClient.fetchPossessionPermissions).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
        expect(gameClient.fetchPossessionPermissions).toHaveBeenCalledTimes(1);
      });

    it('derives the real role set from the already-cached game access entry', async function() {
      await seedGameAccess(cache, { is_dm: true, is_logged: true });

      const gameClient = jasmine.createSpyObj('gameClient', ['fetchPossessionPermissions']);
      gameClient.fetchPossessionPermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensurePossession(cache, gameClient, 'demo');

      expect(gameClient.fetchPossessionPermissions)
        .toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('fires exactly one permissions fetch when access is already resolved/cached before ensurePossession is called',
      async function() {
        await seedGameAccess(cache, { is_dm: true, is_logged: true });

        const gameClient = jasmine.createSpyObj('gameClient', ['fetchPossessionPermissions']);
        gameClient.fetchPossessionPermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

        await AccessStorePermissions.ensurePossession(cache, gameClient, 'demo');

        expect(gameClient.fetchPossessionPermissions).toHaveBeenCalledTimes(1);
      });

    it('issues a corrected fetch when access resolves after the optimistic fetch with a different role set',
      async function() {
        let resolveAccess;
        const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
        const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchPossessionPermissions']);
        gameClient.fetchGameAccess.and.returnValue(accessPromise);
        gameClient.fetchPossessionPermissions.and.returnValues(
          Promise.resolve(fakeResponse({ can_edit: false })),
          Promise.resolve(fakeResponse({ can_edit: true })),
        );

        const resultPromise = AccessStorePermissions.ensurePossession(cache, gameClient, 'demo');
        resolveAccess(fakeResponse({ is_dm: true, is_logged: true }));
        const result = await resultPromise;

        expect(result).toEqual({ can_edit: true });
        expect(gameClient.fetchPossessionPermissions).toHaveBeenCalledTimes(2);
        expect(gameClient.fetchPossessionPermissions.calls.argsFor(0))
          .toEqual(['demo', null, jasmine.anything(), []]);
        expect(gameClient.fetchPossessionPermissions.calls.argsFor(1))
          .toEqual(['demo', null, jasmine.anything(), ['dm', 'logged']]);
      });

    it('resolves to the fail-closed default when the response is not ok', async function() {
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess', 'fetchPossessionPermissions']);
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve(fakeResponse({})));
      gameClient.fetchPossessionPermissions.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStorePermissions.ensurePossession(cache, gameClient, 'demo');

      expect(result).toEqual(PERMISSIONS_DEFAULT);
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      await seedGameAccess(cache, { is_dm: true, is_logged: true });
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchPossessionPermissions']);
      gameClient.fetchPossessionPermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      await AccessStorePermissions.ensurePossession(cache, gameClient, 'demo');

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensurePossession',
        args: ['demo'],
        roleSet: ['dm', 'logged'],
        result: { can_edit: true },
      });
    });
  });
});
