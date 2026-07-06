import AuthEvents from '../../../../../../../assets/js/utils/AuthEvents.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';
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

});
