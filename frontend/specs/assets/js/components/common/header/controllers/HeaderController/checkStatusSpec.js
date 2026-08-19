import AuthEvents from '../../../../../../../../assets/js/utils/auth/AuthEvents.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import { buildContext, buildHeaderController } from './support.js';

describe('HeaderController', function() {
  let setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client, controller;

  const buildController = (overrides = {}) => buildHeaderController(
    { setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client }, overrides
  );

  beforeEach(function() {
    ({ setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, client } = buildContext());
    controller = buildController();
  });

  describe('#checkStatus', function() {
    it('sets loggedIn and emits auth:changed using the header-status response', async function() {
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true }) }));

      await controller.checkStatus();

      expect(client.headerStatus).toHaveBeenCalledWith('tok-123');
      expect(setLoggedIn).toHaveBeenCalledWith(true);
      expect(AuthEvents.emit).toHaveBeenCalledWith(true);
    });

    it('calls setIsSuperUser with the superuser flag from the response', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true, is_superuser: true }) }));

      await controller.checkStatus();

      expect(setIsSuperUser).toHaveBeenCalledWith(true);
    });

    it('calls setIsSuperUser with false when is_superuser is absent', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: false }) }));

      await controller.checkStatus();

      expect(setIsSuperUser).toHaveBeenCalledWith(false);
    });

    it('stores the cache token from the response when present', async function() {
      spyOn(AuthStorage, 'setCacheToken');
      client.headerStatus.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, cache_token: 'new-cache-tok-456' }),
      }));

      await controller.checkStatus();

      expect(AuthStorage.setCacheToken).toHaveBeenCalledWith('new-cache-tok-456');
    });

    it('does not call setCacheToken when the response has no cache_token field', async function() {
      spyOn(AuthStorage, 'setCacheToken');
      client.headerStatus.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true }) }));

      await controller.checkStatus();

      expect(AuthStorage.setCacheToken).not.toHaveBeenCalled();
    });

    it('does nothing when the response is not ok', async function() {
      client.headerStatus.and.returnValue(Promise.resolve({ ok: false }));

      await controller.checkStatus();

      expect(setLoggedIn).not.toHaveBeenCalled();
    });

    it('returns the fail-closed default admin flags when the response is not ok', async function() {
      client.headerStatus.and.returnValue(Promise.resolve({ ok: false }));

      const result = await controller.checkStatus();

      expect(result).toEqual({ isSuperUser: false, isStaff: false });
    });

    it('swallows unexpected errors', async function() {
      client.headerStatus.and.returnValue(Promise.reject(new Error('network')));

      await controller.checkStatus();

      expect(setLoggedIn).not.toHaveBeenCalled();
    });

    it('returns the fail-closed default admin flags when the request throws', async function() {
      client.headerStatus.and.returnValue(Promise.reject(new Error('network')));

      const result = await controller.checkStatus();

      expect(result).toEqual({ isSuperUser: false, isStaff: false });
    });

    it('calls setIsStaff with the staff flag from the response', async function() {
      const setIsStaff = jasmine.createSpy('setIsStaff');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, is_staff: true }),
      }));

      await buildController({ setIsStaff }).checkStatus();

      expect(setIsStaff).toHaveBeenCalledWith(true);
    });

    it('calls setIsStaff with false when is_staff is absent', async function() {
      const setIsStaff = jasmine.createSpy('setIsStaff');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: false }),
      }));

      await buildController({ setIsStaff }).checkStatus();

      expect(setIsStaff).toHaveBeenCalledWith(false);
    });

    it('calls setPendingApproval with true when status is pending', async function() {
      const setPendingApproval = jasmine.createSpy('setPendingApproval');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: false, status: 'pending' }),
      }));

      await buildController({ setPendingApproval }).checkStatus();

      expect(setPendingApproval).toHaveBeenCalledWith(true);
    });

    it('calls setPendingApproval with false when status is absent', async function() {
      const setPendingApproval = jasmine.createSpy('setPendingApproval');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true }),
      }));

      await buildController({ setPendingApproval }).checkStatus();

      expect(setPendingApproval).toHaveBeenCalledWith(false);
    });

    it('resolves the isSuperUser/isStaff flags for callers deriving canViewAs', async function() {
      const setIsStaff = jasmine.createSpy('setIsStaff');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.headerStatus.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, is_superuser: false, is_staff: true }),
      }));

      const result = await buildController({ setIsStaff }).checkStatus();

      expect(result).toEqual({ isSuperUser: false, isStaff: true });
    });
  });

});
