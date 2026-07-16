import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import AccessEvents from '../../../../../../assets/js/utils/access/AccessEvents.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import { ACCESS_DEFAULT, fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
  });

  afterEach(function() {
    // `#syncForRoute` records the page in module-level state, kept around
    // (deliberately, for `#setFacade`/`#syncForAuthChange` re-syncs) beyond
    // `#reset`. Clear it back to neutral so a later, unrelated spec calling
    // `#setFacade` does not re-sync against a page left over from here,
    // firing real (unmocked, in that other spec) client requests.
    AccessStore.syncForRoute(null, '');
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

    it('requests staffOrSuperuser, treasure access, and treasure permissions for the treasure edit page', function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      spyOn(AccessStore, 'ensureTreasureAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureTreasurePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('treasureEdit', '#/treasures/42/edit');

      expect(AccessStore.ensureStaffOrSuperUser).toHaveBeenCalled();
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

    it('clears a DM-scoped facade when navigating to a different game', function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      spyOn(AccessEvents, 'emitFacadeChanged');
      AccessStoreFacade.set(true, ['dm'], 'demo');

      AccessStore.syncForRoute('game', '#/games/other-game');

      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], gameSlug: null });
      expect(AccessEvents.emitFacadeChanged).toHaveBeenCalled();
    });

    it('keeps a DM-scoped facade when the route still matches its gameSlug', function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      spyOn(AccessEvents, 'emitFacadeChanged');
      AccessStoreFacade.set(true, ['dm'], 'demo');

      try {
        AccessStore.syncForRoute('game', '#/games/demo');

        expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm'], gameSlug: 'demo' });
        expect(AccessEvents.emitFacadeChanged).not.toHaveBeenCalled();
      } finally {
        AccessStoreFacade.clear();
      }
    });

    it('does not touch an unscoped (admin/staff) facade when navigating', function() {
      spyOn(AccessEvents, 'emitFacadeChanged');
      AccessStoreFacade.set(true, ['dm']);

      try {
        AccessStore.syncForRoute('home', '#/');

        expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm'], gameSlug: null });
        expect(AccessEvents.emitFacadeChanged).not.toHaveBeenCalled();
      } finally {
        AccessStoreFacade.clear();
      }
    });

    it('clears the recorded page so a later #setFacade does not re-sync it', function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve(ACCESS_DEFAULT));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('game', '#/games/demo');
      AccessStore.syncForRoute(null, '');
      AccessStore.ensureGameAccess.calls.reset();
      AccessStore.ensureGamePermissions.calls.reset();

      try {
        AccessStore.setFacade({ enabled: true, roles: ['dm'] });

        expect(AccessStore.ensureGameAccess).not.toHaveBeenCalled();
        expect(AccessStore.ensureGamePermissions).not.toHaveBeenCalled();
      } finally {
        AccessStoreFacade.clear();
      }
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
