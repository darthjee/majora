import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import AuthClient from '../../../../../../assets/js/client/AuthClient.js';
import { ACCESS_DEFAULT, fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
  });

  afterEach(function() {
    AccessStore.reset();
  });

  describe('#ensureSuperUser', function() {
    it('resolves to true when the status response reports a superuser', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: true })),
      );

      const result = await AccessStore.ensureSuperUser();

      expect(result).toBe(true);
      expect(AccessStore.isSuperUser()).toBe(true);
    });

    it('resolves to false when the response is not ok', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStore.ensureSuperUser();

      expect(result).toBe(false);
    });

    it('resolves to false when the request throws', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(Promise.reject(new Error('network error')));

      const result = await AccessStore.ensureSuperUser();

      expect(result).toBe(false);
    });
  });

  describe('#ensureStaffOrSuperUser', function() {
    it('resolves to true when the status response reports a staff member', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: false, is_staff: true })),
      );

      const result = await AccessStore.ensureStaffOrSuperUser();

      expect(result).toBe(true);
      expect(AccessStore.isStaffOrSuperUser()).toBe(true);
    });

    it('resolves to false when neither flag is set', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: false, is_staff: false })),
      );

      const result = await AccessStore.ensureStaffOrSuperUser();

      expect(result).toBe(false);
    });
  });

  describe('synchronous getters', function() {
    it('return the fail-closed default while a request is pending', async function() {
      let resolvePending;
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        new Promise((resolve) => {
          resolvePending = resolve;
        }),
      );

      const promise = AccessStore.ensureGameAccess('demo');

      expect(AccessStore.getGameAccess('demo')).toEqual(ACCESS_DEFAULT);

      resolvePending(fakeResponse({ username: 'gm' }));
      await promise;

      expect(AccessStore.getGameAccess('demo')).toEqual({ username: 'gm' });
    });

    it('return the fail-closed default for an unrequested key', function() {
      expect(AccessStore.getGameAccess('unknown')).toEqual(ACCESS_DEFAULT);
      expect(AccessStore.getTreasureAccess(1)).toEqual(ACCESS_DEFAULT);
      expect(AccessStore.getGamePermissions('unknown')).toEqual({ can_edit: false });
      expect(AccessStore.getTreasurePermissions(1)).toEqual({ can_edit: false });
      expect(AccessStore.isSuperUser()).toBe(false);
      expect(AccessStore.isStaffOrSuperUser()).toBe(false);
    });
  });
});
