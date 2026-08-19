import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import AccessEvents from '../../../../../../assets/js/utils/access/AccessEvents.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import { fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
    AccessStoreFacade.clear();
  });

  afterEach(function() {
    // A few tests below call the real `#syncForRoute` (directly, or
    // indirectly through `#setFacade`), which records the page in
    // module-level state kept around beyond `#reset`. Clear it back to
    // neutral so a later, unrelated spec calling `#setFacade` does not
    // re-sync against a page left over from here, firing real (unmocked, in
    // that other spec) client requests.
    AccessStore.syncForRoute(null, '');
    AccessStoreFacade.clear();
  });

  describe('#getFacade', function() {
    it('returns disabled/empty by default', function() {
      expect(AccessStore.getFacade()).toEqual({ enabled: false, roles: [], notLogged: false, gameSlug: null });
    });
  });

  describe('#setFacade', function() {
    it('updates the facade state readable via #getFacade', function() {
      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      expect(AccessStore.getFacade()).toEqual({ enabled: true, roles: ['dm'], notLogged: false, gameSlug: null });
    });

    it('threads the notLogged flag through to #getFacade', function() {
      AccessStore.setFacade({ enabled: true, roles: [], notLogged: true });

      expect(AccessStore.getFacade()).toEqual({ enabled: true, roles: [], notLogged: true, gameSlug: null });
    });

    it('scopes the facade to the given gameSlug for a non-admin (DM) activation', function() {
      spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(false);

      AccessStore.setFacade({ enabled: true, roles: ['dm'], gameSlug: 'epic-quest' });

      expect(AccessStore.getFacade()).toEqual({
        enabled: true, roles: ['dm'], notLogged: false, gameSlug: 'epic-quest',
      });
    });

    it('ignores the given gameSlug for a real staff/superuser activation', function() {
      spyOn(AccessStore, 'isStaffOrSuperUser').and.returnValue(true);

      AccessStore.setFacade({ enabled: true, roles: ['dm'], gameSlug: 'epic-quest' });

      expect(AccessStore.getFacade()).toEqual({ enabled: true, roles: ['dm'], notLogged: false, gameSlug: null });
    });

    it('resets cached state and re-syncs the current page route', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('game', '#/games/demo');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledTimes(1);

      AccessStore.setFacade({ enabled: true, roles: ['dm'] });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledTimes(2);
    });

    it('emits AccessEvents.emitFacadeChanged exactly once', function() {
      spyOn(AccessEvents, 'emitFacadeChanged');

      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      expect(AccessEvents.emitFacadeChanged).toHaveBeenCalledTimes(1);
    });

    it('threads the simulated roles (plus "logged") into the next #ensureGamePermissions fetch', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      await AccessStore.ensureGamePermissions('demo');

      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
    });

    it('sends an empty role set into the next #ensureGamePermissions fetch when "Not Logged" is on', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: false })),
      );

      AccessStore.setFacade({ enabled: true, roles: ['dm'], notLogged: true });

      await AccessStore.ensureGamePermissions('demo');

      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });
  });

  describe('#syncForAuthChange', function() {
    it('resets the facade back to disabled/empty', function() {
      AccessStore.setFacade({ enabled: true, roles: ['dm'] });

      AccessStore.syncForAuthChange();

      expect(AccessStore.getFacade()).toEqual({ enabled: false, roles: [], notLogged: false, gameSlug: null });
    });

    it('does not emit AccessEvents.emitFacadeChanged', function() {
      spyOn(AccessEvents, 'emitFacadeChanged');

      AccessStore.syncForAuthChange();

      expect(AccessEvents.emitFacadeChanged).not.toHaveBeenCalled();
    });
  });
});
