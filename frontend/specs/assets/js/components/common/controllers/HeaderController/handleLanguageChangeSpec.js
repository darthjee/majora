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

});
