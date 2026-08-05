import AccessStorePermissions from '../../../../../../../assets/js/utils/access/store/AccessStorePermissions.js';
import AccessCache from '../../../../../../../assets/js/utils/access/AccessCache.js';
import AccessStoreFacade from '../../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import MajoraLogger from '../../../../../../../assets/js/utils/logging/MajoraLogger.js';
import { PERMISSIONS_DEFAULT, fakeResponse, seedTreasureAccess } from './support.js';

describe('AccessStorePermissions', function() {
  let cache;

  beforeEach(function() {
    cache = new AccessCache();
    AccessStoreFacade.clear();
  });

  afterEach(function() {
    AccessStoreFacade.clear();
  });

  describe('#ensureTreasure / #getTreasure', function() {
    it('fetches, caches, and returns the treasure permissions payload', async function() {
      const treasureClient = jasmine.createSpyObj(
        'treasureClient', ['fetchTreasureAccess', 'fetchTreasurePermissions'],
      );
      treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve(fakeResponse({})));
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

    it('fires exactly one permissions fetch when access is already resolved/cached before ensureTreasure is called',
      async function() {
        await seedTreasureAccess(cache, { is_dm: true, is_logged: true });

        const treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasurePermissions']);
        treasureClient.fetchTreasurePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

        await AccessStorePermissions.ensureTreasure(cache, treasureClient, 1);

        expect(treasureClient.fetchTreasurePermissions).toHaveBeenCalledWith(
          1, null, jasmine.anything(), ['dm', 'logged'], false,
        );
        expect(treasureClient.fetchTreasurePermissions).toHaveBeenCalledTimes(1);
      });

    it('issues a corrected fetch when access resolves after the optimistic fetch with a different role set',
      async function() {
        let resolveAccess;
        const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
        const treasureClient = jasmine.createSpyObj(
          'treasureClient', ['fetchTreasureAccess', 'fetchTreasurePermissions'],
        );
        treasureClient.fetchTreasureAccess.and.returnValue(accessPromise);
        treasureClient.fetchTreasurePermissions.and.returnValues(
          Promise.resolve(fakeResponse({ can_edit: false })),
          Promise.resolve(fakeResponse({ can_edit: true })),
        );

        const resultPromise = AccessStorePermissions.ensureTreasure(cache, treasureClient, 1);
        resolveAccess(fakeResponse({ is_dm: true, is_logged: true }));
        const result = await resultPromise;

        expect(result).toEqual({ can_edit: true });
        expect(treasureClient.fetchTreasurePermissions).toHaveBeenCalledTimes(2);
        expect(treasureClient.fetchTreasurePermissions.calls.argsFor(0))
          .toEqual([1, null, jasmine.anything(), [], false]);
        expect(treasureClient.fetchTreasurePermissions.calls.argsFor(1))
          .toEqual([1, null, jasmine.anything(), ['dm', 'logged'], false]);
      });

    it('fires exactly one permissions fetch under an active facade even when the real access resolves later ' +
      'with different real roles', async function() {
      let resolveAccess;
      const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
      AccessStoreFacade.set(true, ['dm']);
      const treasureClient = jasmine.createSpyObj(
        'treasureClient', ['fetchTreasureAccess', 'fetchTreasurePermissions'],
      );
      treasureClient.fetchTreasureAccess.and.returnValue(accessPromise);
      treasureClient.fetchTreasurePermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      const resultPromise = AccessStorePermissions.ensureTreasure(cache, treasureClient, 1);
      resolveAccess(fakeResponse({ is_dm: true, is_logged: true }));
      await resultPromise;

      expect(treasureClient.fetchTreasurePermissions).toHaveBeenCalledTimes(1);
      expect(treasureClient.fetchTreasurePermissions).toHaveBeenCalledWith(
        1, null, jasmine.anything(), ['dm', 'logged'], false,
      );
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      const debugSpy = spyOn(MajoraLogger, 'debug');
      const treasureClient = jasmine.createSpyObj(
        'treasureClient', ['fetchTreasureAccess', 'fetchTreasurePermissions'],
      );
      treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve(fakeResponse({})));
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
