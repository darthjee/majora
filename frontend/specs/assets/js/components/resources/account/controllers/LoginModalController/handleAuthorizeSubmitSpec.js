import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';
import AuthEvents from '../../../../../../../../assets/js/utils/auth/AuthEvents.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('LoginModalController', function() {
  let setUsername;
  let setPassword;
  let setIncorrect;
  let setError;
  let onSuccess;
  let client;
  let setAuthorizeStatus;
  let poller;

  beforeEach(function() {
    setUsername = jasmine.createSpy('setUsername');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    onSuccess = jasmine.createSpy('onSuccess');
    setAuthorizeStatus = jasmine.createSpy('setAuthorizeStatus');
    client = {
      createAuthorizationRequest: jasmine.createSpy('createAuthorizationRequest'),
    };
    poller = {
      start: jasmine.createSpy('start'),
      stop: jasmine.createSpy('stop'),
    };
  });

  const buildController = () => new LoginModalController(
    setUsername,
    setPassword,
    setIncorrect,
    setError,
    onSuccess,
    client,
    null,
    setAuthorizeStatus,
    poller
  );

  describe('#handleAuthorizeSubmit', function() {
    it('sets the status to waiting and starts the poller on success', async function() {
      const request = { uuid: 'some-uuid', token: 'authorize-tok', expiration: '2099-01-01T00:00:00Z' };

      client.createAuthorizationRequest.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(request),
      }));

      const controller = buildController();

      await controller.handleAuthorizeSubmit('majora-user');

      expect(client.createAuthorizationRequest).toHaveBeenCalledWith('majora-user');
      expect(setAuthorizeStatus).toHaveBeenCalledWith('waiting');
      expect(poller.start).toHaveBeenCalledWith(request, jasmine.any(Function));
    });

    it('sets the status to error when the create request fails', async function() {
      client.createAuthorizationRequest.and.returnValue(Promise.resolve({ ok: false, status: 429 }));

      const controller = buildController();

      await controller.handleAuthorizeSubmit('majora-user');

      expect(setAuthorizeStatus).toHaveBeenCalledWith('error');
      expect(poller.start).not.toHaveBeenCalled();
    });

    it('sets the status to error when the client rejects', async function() {
      client.createAuthorizationRequest.and.returnValue(Promise.reject(new Error('network')));

      const controller = buildController();

      await controller.handleAuthorizeSubmit('majora-user');

      expect(setAuthorizeStatus).toHaveBeenCalledWith('error');
    });

    it('applies the same success path as password login once the poller reports approval', async function() {
      const request = { uuid: 'some-uuid', token: 'authorize-tok', expiration: '2099-01-01T00:00:00Z' };

      client.createAuthorizationRequest.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(request),
      }));
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'setToken');
      spyOn(AuthStorage, 'setCacheToken');

      const controller = buildController();

      await controller.handleAuthorizeSubmit('majora-user');

      const onEvent = poller.start.calls.mostRecent().args[1];

      onEvent({ status: 'approved', token: 'login-tok' });

      expect(setAuthorizeStatus).toHaveBeenCalledWith('approved');
      expect(AuthStorage.setToken).toHaveBeenCalledWith('login-tok');
      expect(AuthStorage.setCacheToken).toHaveBeenCalledWith(null);
      expect(AuthEvents.emit).toHaveBeenCalledWith(true);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('forwards a terminal denied/expired/retrying event to setAuthorizeStatus', async function() {
      const request = { uuid: 'some-uuid', token: 'authorize-tok', expiration: '2099-01-01T00:00:00Z' };

      client.createAuthorizationRequest.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(request),
      }));

      const controller = buildController();

      await controller.handleAuthorizeSubmit('majora-user');

      const onEvent = poller.start.calls.mostRecent().args[1];

      onEvent({ status: 'denied' });

      expect(setAuthorizeStatus).toHaveBeenCalledWith('denied');
    });

    it('does not update the status for an "open" event', async function() {
      const request = { uuid: 'some-uuid', token: 'authorize-tok', expiration: '2099-01-01T00:00:00Z' };

      client.createAuthorizationRequest.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(request),
      }));

      const controller = buildController();

      await controller.handleAuthorizeSubmit('majora-user');
      setAuthorizeStatus.calls.reset();

      const onEvent = poller.start.calls.mostRecent().args[1];

      onEvent({ status: 'open' });

      expect(setAuthorizeStatus).not.toHaveBeenCalled();
    });
  });
});
