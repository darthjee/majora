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

});
