import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import { ACCESS_DEFAULT, fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
  });

  afterEach(function() {
    AccessStore.reset();
  });

  describe('#syncForRoute', function() {
    it('resets cached state and requests both the game access and permissions for a game page', function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('game', '#/games/demo');

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo', []);
    });

    it('requests both character access and permissions for a character page', function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('pcCharacter', '#/games/demo/pcs/2');

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '2', []);
    });

    it('requests superuser, treasure access, and treasure permissions for the treasure edit page', function() {
      spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(true));
      spyOn(AccessStore, 'ensureTreasureAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureTreasurePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('treasureEdit', '#/treasures/42/edit');

      expect(AccessStore.ensureSuperUser).toHaveBeenCalled();
      expect(AccessStore.ensureTreasureAccess).toHaveBeenCalledWith('42');
      expect(AccessStore.ensureTreasurePermissions).toHaveBeenCalledWith('42', []);
    });

    it('requests staffOrSuperuser access for a staff page', function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

      AccessStore.syncForRoute('staffUsers', '#/staff/users');

      expect(AccessStore.ensureStaffOrSuperUser).toHaveBeenCalled();
    });

    it('is a no-op besides resetting for a page with no access check', function() {
      expect(() => AccessStore.syncForRoute('home', '#/')).not.toThrow();
    });

    it('clears any previously cached entry', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ username: 'gm' })),
      );

      await AccessStore.ensureGameAccess('demo');
      expect(AccessStore.getGameAccess('demo')).toEqual({ username: 'gm' });

      AccessStore.syncForRoute('home', '#/');

      expect(AccessStore.getGameAccess('demo')).toEqual(ACCESS_DEFAULT);
    });
  });

  describe('#syncForAuthChange', function() {
    it('aborts in-flight requests, clears the cache, and re-syncs the last route', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ username: 'gm' })),
      );
      spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      AccessStore.syncForRoute('game', '#/games/demo');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      AccessStore.syncForAuthChange();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
