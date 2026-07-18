import AuthEvents from '../../../../../../../../assets/js/utils/auth/AuthEvents.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import { buildContext, buildHeaderController } from './support.js';

describe('HeaderController', function() {
  let setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client, controller;

  const buildController = (overrides = {}) => buildHeaderController(
    { setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client }, overrides
  );

  beforeEach(function() {
    ({ setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client } = buildContext());
    controller = buildController();
  });

  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('#checkStatus', function() {
    it('sets loggedIn and emits auth:changed using the status response', async function() {
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true, username: 'majora-user' }) }));

      await controller.checkStatus();

      expect(client.status).toHaveBeenCalledWith('tok-123');
      expect(setLoggedIn).toHaveBeenCalledWith(true);
      expect(AuthEvents.emit).toHaveBeenCalledWith(true);
    });

    it('calls setIsSuperUser with the superuser flag from the status response', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true, is_superuser: true }) }));

      await controller.checkStatus();

      expect(setIsSuperUser).toHaveBeenCalledWith(true);
    });

    it('calls setIsSuperUser with false when is_superuser is absent', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: false }) }));

      await controller.checkStatus();

      expect(setIsSuperUser).toHaveBeenCalledWith(false);
    });

    it('stores the token from the status response when present', async function() {
      spyOn(AuthStorage, 'setToken');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true, token: 'new-tok-456' }) }));

      await controller.checkStatus();

      expect(AuthStorage.setToken).toHaveBeenCalledWith('new-tok-456');
    });

    it('does not call setToken when the status response has no token field', async function() {
      spyOn(AuthStorage, 'setToken');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true }) }));

      await controller.checkStatus();

      expect(AuthStorage.setToken).not.toHaveBeenCalled();
    });

    it('does nothing when the status response is not ok', async function() {
      client.status.and.returnValue(Promise.resolve({ ok: false }));

      await controller.checkStatus();

      expect(setLoggedIn).not.toHaveBeenCalled();
    });

    it('swallows unexpected errors', async function() {
      client.status.and.returnValue(Promise.reject(new Error('network')));

      await controller.checkStatus();

      expect(setLoggedIn).not.toHaveBeenCalled();
    });

    it('applies the favorite language from settings when different from the current one', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(Translator, 'getLanguage').and.returnValue('en');
      spyOn(Translator, 'setLanguage');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true, settings: { favorite_language: 'fr' } }) }));

      await controller.checkStatus();

      expect(Translator.setLanguage).toHaveBeenCalledWith('fr');
    });

    it('does not apply the favorite language when it matches the current one', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(Translator, 'getLanguage').and.returnValue('en');
      spyOn(Translator, 'setLanguage');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true, settings: { favorite_language: 'en' } }) }));

      await controller.checkStatus();

      expect(Translator.setLanguage).not.toHaveBeenCalled();
    });

    it('does not apply a language when settings are absent', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(Translator, 'setLanguage');
      client.status.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: false }) }));

      await controller.checkStatus();

      expect(Translator.setLanguage).not.toHaveBeenCalled();
    });

    it('calls setIsStaff with the staff flag from the status response', async function() {
      const setIsStaff = jasmine.createSpy('setIsStaff');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, is_staff: true }),
      }));

      await buildController({ setIsStaff }).checkStatus();

      expect(setIsStaff).toHaveBeenCalledWith(true);
    });

    it('calls setIsStaff with false when is_staff is absent', async function() {
      const setIsStaff = jasmine.createSpy('setIsStaff');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: false }),
      }));

      await buildController({ setIsStaff }).checkStatus();

      expect(setIsStaff).toHaveBeenCalledWith(false);
    });
  });

});
