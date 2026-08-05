import AccessStorePermissions from '../../../../../../../assets/js/utils/access/store/AccessStorePermissions.js';
import AccessStoreAccess from '../../../../../../../assets/js/utils/access/store/AccessStoreAccess.js';
import AccessCache from '../../../../../../../assets/js/utils/access/AccessCache.js';
import AccessStoreFacade from '../../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import MajoraLogger from '../../../../../../../assets/js/utils/logging/MajoraLogger.js';
import { PERMISSIONS_DEFAULT, fakeResponse, seedCharacterAccess } from './support.js';

describe('AccessStorePermissions', function() {
  let cache;

  beforeEach(function() {
    cache = new AccessCache();
    AccessStoreFacade.clear();
  });

  afterEach(function() {
    AccessStoreFacade.clear();
  });

  describe('#ensureCharacter / #getCharacter', function() {
    it('fetches, caches, and returns the character permissions payload', async function() {
      const characterClient = jasmine.createSpyObj(
        'characterClient', ['fetchCharacterAccess', 'fetchCharacterPermissions'],
      );
      characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve(fakeResponse({})));
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
      expect(characterClient.fetchCharacterPermissions).toHaveBeenCalledTimes(1);
    });

    it('issues a corrected fetch when access resolves after the optimistic fetch with a different role set',
      async function() {
        let resolveAccess;
        const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
        const characterClient = jasmine.createSpyObj(
          'characterClient', ['fetchCharacterAccess', 'fetchCharacterPermissions'],
        );
        characterClient.fetchCharacterAccess.and.returnValue(accessPromise);
        characterClient.fetchCharacterPermissions.and.returnValues(
          Promise.resolve(fakeResponse({ can_edit: false })),
          Promise.resolve(fakeResponse({ can_edit: true })),
        );

        const resultPromise = AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');
        resolveAccess(fakeResponse({ is_owner: true, is_logged: true }));
        const result = await resultPromise;

        expect(result).toEqual({ can_edit: true });
        expect(characterClient.fetchCharacterPermissions).toHaveBeenCalledTimes(2);
        expect(characterClient.fetchCharacterPermissions.calls.argsFor(0))
          .toEqual(['pcs', 'demo', '2', null, jasmine.anything(), []]);
        expect(characterClient.fetchCharacterPermissions.calls.argsFor(1))
          .toEqual(['pcs', 'demo', '2', null, jasmine.anything(), ['logged', 'owner']]);
      });

    it('fires exactly one permissions fetch under an active facade even when the real access resolves later ' +
      'with different real roles', async function() {
      let resolveAccess;
      const accessPromise = new Promise((resolve) => { resolveAccess = resolve; });
      AccessStoreFacade.set(true, ['dm']);
      const characterClient = jasmine.createSpyObj(
        'characterClient', ['fetchCharacterAccess', 'fetchCharacterPermissions'],
      );
      characterClient.fetchCharacterAccess.and.returnValue(accessPromise);
      characterClient.fetchCharacterPermissions.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));

      const resultPromise = AccessStorePermissions.ensureCharacter(cache, characterClient, 'pcs', 'demo', '2');
      resolveAccess(fakeResponse({ is_owner: true, is_logged: true }));
      await resultPromise;

      expect(characterClient.fetchCharacterPermissions).toHaveBeenCalledTimes(1);
      expect(characterClient.fetchCharacterPermissions).toHaveBeenCalledWith(
        'pcs', 'demo', '2', null, jasmine.anything(), ['dm', 'logged'],
      );
    });

    it('logs the request, resolved role set, and result at debug level', async function() {
      await seedCharacterAccess(cache, {});
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
});
