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

  describe('#handleModalClose', function() {
    it('closes the login modal', function() {
      controller.handleModalClose();

      expect(setShowModal).toHaveBeenCalledWith(false);
    });
  });

});
