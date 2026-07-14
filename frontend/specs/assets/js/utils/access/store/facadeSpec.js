import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import { fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
    AccessStoreFacade.clear();
  });

  afterEach(function() {
    AccessStore.reset();
    AccessStoreFacade.clear();
  });

  describe('#getFacade', function() {
    it('returns disabled/empty by default', function() {
      expect(AccessStore.getFacade()).toEqual({ enabled: false, roles: [] });
    });
  });

  describe('#setFacade', function() {
    it('updates the facade state readable via #getFacade', function() {
      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      expect(AccessStore.getFacade()).toEqual({ enabled: true, roles: ['dm'] });
    });

    it('resets cached state and re-syncs the current page route', function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('game', '#/games/demo');
      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledTimes(1);

      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledTimes(2);
    });

    it('threads the simulated roles into the next #ensureGamePermissions fetch', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      await AccessStore.ensureGamePermissions('demo');

      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm']);
    });
  });

  describe('#isReallyAdminOrStaff', function() {
    it('delegates to #ensureStaffOrSuperUser, resolving the real (facade-independent) identity', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

      const result = await AccessStore.isReallyAdminOrStaff();

      expect(result).toBe(true);
      expect(AccessStore.ensureStaffOrSuperUser).toHaveBeenCalled();
    });
  });

  describe('#syncForAuthChange', function() {
    it('resets the facade back to disabled/empty', function() {
      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      AccessStore.syncForAuthChange();

      expect(AccessStore.getFacade()).toEqual({ enabled: false, roles: [] });
    });
  });
});
