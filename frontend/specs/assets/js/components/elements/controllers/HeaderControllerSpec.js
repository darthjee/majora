import HeaderController from '../../../../../../assets/js/components/elements/controllers/HeaderController.js';
import AuthEvents from '../../../../../../assets/js/utils/AuthEvents.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';
import Translator from '../../../../../../assets/js/i18n/Translator.js';

describe('HeaderController', function() {
  let setLoggedIn;
  let setShowModal;
  let setTestEmailStatus;
  let client;

  beforeEach(function() {
    setLoggedIn = jasmine.createSpy('setLoggedIn');
    setShowModal = jasmine.createSpy('setShowModal');
    setTestEmailStatus = jasmine.createSpy('setTestEmailStatus');
    client = {
      status: jasmine.createSpy('status'),
      logout: jasmine.createSpy('logout'),
      sendTestEmail: jasmine.createSpy('sendTestEmail'),
      setLanguagePreference: jasmine.createSpy('setLanguagePreference'),
    };
  });

  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('#checkStatus', function() {
    it('sets loggedIn and emits auth:changed using the status response', async function() {
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, username: 'majora-user' }),
      }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(client.status).toHaveBeenCalledWith('tok-123');
      expect(setLoggedIn).toHaveBeenCalledWith(true);
      expect(AuthEvents.emit).toHaveBeenCalledWith(true);
    });

    it('stores the token from the status response when present', async function() {
      spyOn(AuthStorage, 'setToken');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, token: 'new-tok-456' }),
      }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(AuthStorage.setToken).toHaveBeenCalledWith('new-tok-456');
    });

    it('does not call setToken when the status response has no token field', async function() {
      spyOn(AuthStorage, 'setToken');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true }),
      }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(AuthStorage.setToken).not.toHaveBeenCalled();
    });

    it('does nothing when the status response is not ok', async function() {
      client.status.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(setLoggedIn).not.toHaveBeenCalled();
    });

    it('swallows unexpected errors', async function() {
      client.status.and.returnValue(Promise.reject(new Error('network')));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(setLoggedIn).not.toHaveBeenCalled();
    });

    it('applies the favorite language from settings when different from the current one', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(Translator, 'getLanguage').and.returnValue('en');
      spyOn(Translator, 'setLanguage');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, settings: { favorite_language: 'fr' } }),
      }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(Translator.setLanguage).toHaveBeenCalledWith('fr');
    });

    it('does not apply the favorite language when it matches the current one', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(Translator, 'getLanguage').and.returnValue('en');
      spyOn(Translator, 'setLanguage');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: true, settings: { favorite_language: 'en' } }),
      }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(Translator.setLanguage).not.toHaveBeenCalled();
    });

    it('does not apply a language when settings are absent', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(Translator, 'setLanguage');
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ logged_in: false }),
      }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.checkStatus();

      expect(Translator.setLanguage).not.toHaveBeenCalled();
    });
  });

  describe('#handleLoginClick', function() {
    it('opens the login modal', function() {
      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      controller.handleLoginClick();

      expect(setShowModal).toHaveBeenCalledWith(true);
    });
  });

  describe('#handleLogoffClick', function() {
    it('logs out, clears the token, sets loggedIn false and emits auth:changed', async function() {
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(AuthStorage, 'clearToken');
      client.logout.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleLogoffClick();

      expect(client.logout).toHaveBeenCalledWith('tok-123');
      expect(AuthStorage.clearToken).toHaveBeenCalled();
      expect(setLoggedIn).toHaveBeenCalledWith(false);
      expect(AuthEvents.emit).toHaveBeenCalledWith(false);
    });

    it('still clears state and emits when logout request fails', async function() {
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      spyOn(AuthStorage, 'clearToken');
      client.logout.and.returnValue(Promise.reject(new Error('network')));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleLogoffClick();

      expect(AuthStorage.clearToken).toHaveBeenCalled();
      expect(setLoggedIn).toHaveBeenCalledWith(false);
      expect(AuthEvents.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleModalClose', function() {
    it('closes the login modal', function() {
      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      controller.handleModalClose();

      expect(setShowModal).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleLoginSuccess', function() {
    it('marks the user logged in and closes the modal', function() {
      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      controller.handleLoginSuccess();

      expect(setLoggedIn).toHaveBeenCalledWith(true);
      expect(setShowModal).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleSendTestEmailClick', function() {
    it('sends the test email and sets the status to sent on success', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.sendTestEmail.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleSendTestEmailClick();

      expect(client.sendTestEmail).toHaveBeenCalledWith('tok-123');
      expect(setTestEmailStatus).toHaveBeenCalledWith('sent');
    });

    it('sets the status to error when the response is not ok', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.sendTestEmail.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleSendTestEmailClick();

      expect(setTestEmailStatus).toHaveBeenCalledWith('error');
    });

    it('sets the status to error when the request fails', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.sendTestEmail.and.returnValue(Promise.reject(new Error('network')));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleSendTestEmailClick();

      expect(setTestEmailStatus).toHaveBeenCalledWith('error');
    });
  });

  describe('#handleLanguageChange', function() {
    it('persists the language preference when logged in', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.setLanguagePreference.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleLanguageChange('fr', true);

      expect(client.setLanguagePreference).toHaveBeenCalledWith('tok-123', 'fr');
    });

    it('does nothing when not logged in', async function() {
      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);
      await controller.handleLanguageChange('fr', false);

      expect(client.setLanguagePreference).not.toHaveBeenCalled();
    });

    it('swallows errors persisting the language preference', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.setLanguagePreference.and.returnValue(Promise.reject(new Error('network')));

      const controller = new HeaderController(setLoggedIn, setShowModal, setTestEmailStatus, client);

      await expectAsync(controller.handleLanguageChange('fr', true)).toBeResolved();
    });
  });
});
