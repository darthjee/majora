import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';
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

  describe('#recheckAuthState', function() {
    let viewAsController;

    beforeEach(function() {
      viewAsController = jasmine.createSpyObj('viewAsController', ['checkAvailability']);
      viewAsController.checkAvailability.and.returnValue(Promise.resolve());
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-123');
      client.status.and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: true }) })
      );
    });

    it('re-runs the auth status check', async function() {
      await controller.recheckAuthState(viewAsController);

      expect(client.status).toHaveBeenCalledWith('tok-123');
      expect(setLoggedIn).toHaveBeenCalledWith(true);
    });

    it('re-runs the view-as availability check', async function() {
      await controller.recheckAuthState(viewAsController);

      expect(viewAsController.checkAvailability).toHaveBeenCalled();
    });
  });
});
