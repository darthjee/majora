import HeaderController from '../../../../../../assets/js/components/elements/controllers/HeaderController.js';
import AuthEvents from '../../../../../../assets/js/utils/AuthEvents.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import HashRouteResolver from '../../../../../../assets/js/utils/HashRouteResolver.js';

describe('HeaderController', function() {
  let setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus, client, controller;

  const buildController = (overrides = {}) => new HeaderController(
    setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser, setServerStatus,
    client, undefined, undefined,
    overrides.setRoute ?? Noop.noop,
    overrides.routeResolver,
    overrides.eventTarget
  );

  beforeEach(function() {
    setLoggedIn = jasmine.createSpy('setLoggedIn');
    setShowModal = jasmine.createSpy('setShowModal');
    setTestEmailStatus = jasmine.createSpy('setTestEmailStatus');
    setIsSuperUser = jasmine.createSpy('setIsSuperUser');
    setServerStatus = jasmine.createSpy('setServerStatus');
    client = {
      status: jasmine.createSpy('status'),
      logout: jasmine.createSpy('logout'),
      sendTestEmail: jasmine.createSpy('sendTestEmail'),
      setLanguagePreference: jasmine.createSpy('setLanguagePreference'),
    };
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
  });

  describe('#handleLoginClick', function() {
    it('opens the login modal', function() {
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

      await controller.handleLogoffClick();

      expect(AuthStorage.clearToken).toHaveBeenCalled();
      expect(setLoggedIn).toHaveBeenCalledWith(false);
      expect(AuthEvents.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleModalClose', function() {
    it('closes the login modal', function() {
      controller.handleModalClose();

      expect(setShowModal).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleLoginSuccess', function() {
    it('marks the user logged in and closes the modal', function() {
      controller.handleLoginSuccess();

      expect(setLoggedIn).toHaveBeenCalledWith(true);
      expect(setShowModal).toHaveBeenCalledWith(false);
    });
  });

  describe('#handleSendTestEmailClick', function() {
    it('sends the test email and sets the status to sent on success', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.sendTestEmail.and.returnValue(Promise.resolve({ ok: true }));

      await controller.handleSendTestEmailClick();

      expect(client.sendTestEmail).toHaveBeenCalledWith('tok-123');
      expect(setTestEmailStatus).toHaveBeenCalledWith('sent');
    });

    it('sets the status to error when the response is not ok', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.sendTestEmail.and.returnValue(Promise.resolve({ ok: false }));

      await controller.handleSendTestEmailClick();

      expect(setTestEmailStatus).toHaveBeenCalledWith('error');
    });

    it('sets the status to error when the request fails', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.sendTestEmail.and.returnValue(Promise.reject(new Error('network')));

      await controller.handleSendTestEmailClick();

      expect(setTestEmailStatus).toHaveBeenCalledWith('error');
    });
  });

  describe('#handleLanguageChange', function() {
    it('persists the language preference when logged in', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.setLanguagePreference.and.returnValue(Promise.resolve({ ok: true }));

      await controller.handleLanguageChange('fr', true);

      expect(client.setLanguagePreference).toHaveBeenCalledWith('tok-123', 'fr');
    });

    it('does nothing when not logged in', async function() {
      await controller.handleLanguageChange('fr', false);

      expect(client.setLanguagePreference).not.toHaveBeenCalled();
    });

    it('swallows errors persisting the language preference', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.setLanguagePreference.and.returnValue(Promise.reject(new Error('network')));

      await expectAsync(controller.handleLanguageChange('fr', true)).toBeResolved();
    });
  });

  describe('#getRoute', function() {
    it('returns just the page for routes without params', function() {
      const routeResolver = { getPage: () => 'home', getParams: jasmine.createSpy('getParams') };
      const controller = buildController({ routeResolver });

      expect(controller.getRoute()).toEqual({ page: 'home' });
      expect(routeResolver.getParams).not.toHaveBeenCalled();
    });

    [
      { page: 'game', pattern: '/games/:game_slug', params: { game_slug: 'campaign' }, characterId: undefined },
      { page: 'pcCharacter', pattern: '/games/:game_slug/pcs/:character_id', params: { game_slug: 'campaign', character_id: '7' }, characterId: '7' },
      { page: 'npcCharacter', pattern: '/games/:game_slug/npcs/:character_id', params: { game_slug: 'campaign', character_id: '9' }, characterId: '9' },
    ].forEach(({ page, pattern, params, characterId }) => {
      it(`returns the gameSlug/characterId for the ${page} route`, function() {
        const routeResolver = { getPage: () => page, getParams: jasmine.createSpy('getParams').and.returnValue(params) };
        const controller = buildController({ routeResolver });

        expect(controller.getRoute()).toEqual({ page, gameSlug: 'campaign', characterId });
        expect(routeResolver.getParams).toHaveBeenCalledWith(pattern);
      });
    });
  });

  describe('#buildRouteEffect', function() {
    it('subscribes to hashchange and pushes the resolved route into setRoute', function() {
      const setRoute = jasmine.createSpy('setRoute');
      const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
      let hash = '#/games/campaign';
      const routeResolver = new HashRouteResolver(() => hash);
      const controller = buildController({ setRoute, routeResolver, eventTarget });
      controller.buildRouteEffect()();

      expect(eventTarget.addEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));
      const handler = eventTarget.addEventListener.calls.mostRecent().args[1];
      hash = '#/games/campaign/pcs/7';
      handler();

      expect(setRoute).toHaveBeenCalledWith({ page: 'pcCharacter', gameSlug: 'campaign', characterId: '7' });
    });

    it('unsubscribes from hashchange on cleanup', function() {
      const eventTarget = jasmine.createSpyObj('eventTarget', ['addEventListener', 'removeEventListener']);
      const routeResolver = { getPage: () => 'home', getParams: () => ({}) };
      const controller = buildController({ routeResolver, eventTarget });
      controller.buildRouteEffect()()();

      expect(eventTarget.removeEventListener).toHaveBeenCalledWith('hashchange', jasmine.any(Function));
    });
  });

});
