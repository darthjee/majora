import RecoverPasswordController
  from '../../../../../../../../assets/js/components/resources/account/pages/controllers/RecoverPasswordController.js';

describe('RecoverPasswordController', function() {
  describe('getRecoverPasswordTokenFromHash', function() {
    it('extracts the token from the hash query string', function() {
      expect(RecoverPasswordController.getRecoverPasswordTokenFromHash('#/recover-password?token=abc123'))
        .toBe('abc123');
    });

    it('returns an empty string when there is no token', function() {
      expect(RecoverPasswordController.getRecoverPasswordTokenFromHash('#/recover-password')).toBe('');
    });
  });

  describe('#handleSubmit', function() {
    let setStatus;
    let setErrorMessage;
    let client;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setErrorMessage = jasmine.createSpy('setErrorMessage');
      client = jasmine.createSpyObj('client', ['resetPassword']);
    });

    it('marks an error when the passwords do not match without calling the client', async function() {
      const controller = new RecoverPasswordController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('tok-123', 'secret1', 'secret2');

      expect(client.resetPassword).not.toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('Passwords do not match.');
    });

    it('marks success when the server resets the password', async function() {
      client.resetPassword.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ reset: true }) }));

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('tok-123', 'secret', 'secret');

      expect(client.resetPassword).toHaveBeenCalledWith('tok-123', 'secret');
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setStatus).toHaveBeenCalledWith('success');
    });

    it('surfaces the server error message when the request fails', async function() {
      client.resetPassword.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid or expired token' }),
      }));

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('tok-123', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('Invalid or expired token');
    });

    it('falls back to a generic error message when the server omits one', async function() {
      client.resetPassword.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }));

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('tok-123', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('Unable to reset password, please try again.');
    });

    it('marks an unexpected error when the client rejects', async function() {
      client.resetPassword.and.returnValue(Promise.reject(new Error('network')));

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('tok-123', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('An unexpected error occurred, please try again later.');
    });
  });

  describe('#waitUntilReady', function() {
    let setStatus;
    let setErrorMessage;
    let setReady;
    let healthClient;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setErrorMessage = jasmine.createSpy('setErrorMessage');
      setReady = jasmine.createSpy('setReady');
      healthClient = jasmine.createSpyObj('healthClient', ['check']);
    });

    it('marks ready immediately on a 200 response', async function() {
      healthClient.check.and.returnValue(Promise.resolve({ status: 200 }));

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, undefined, healthClient);

      await controller.waitUntilReady(setReady);

      expect(healthClient.check).toHaveBeenCalledTimes(1);
      expect(setReady).toHaveBeenCalledWith(true);
    });

    it('retries after a 502 response before becoming ready', async function() {
      healthClient.check.and.returnValues(
        Promise.resolve({ status: 502 }),
        Promise.resolve({ status: 200 })
      );

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, undefined, healthClient);

      await controller.waitUntilReady(setReady, 1);

      expect(healthClient.check).toHaveBeenCalledTimes(2);
      expect(setReady).toHaveBeenCalledWith(true);
    });

    it('retries after any other non-2xx response before becoming ready', async function() {
      healthClient.check.and.returnValues(
        Promise.resolve({ status: 404 }),
        Promise.resolve({ status: 200 })
      );

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, undefined, healthClient);

      await controller.waitUntilReady(setReady, 1);

      expect(healthClient.check).toHaveBeenCalledTimes(2);
      expect(setReady).toHaveBeenCalledWith(true);
    });

    it('retries after the health check throws (e.g. the AbortSignal timeout)', async function() {
      healthClient.check.and.returnValues(
        Promise.reject(new Error('timeout')),
        Promise.resolve({ status: 200 })
      );

      const controller = new RecoverPasswordController(setStatus, setErrorMessage, undefined, healthClient);

      await controller.waitUntilReady(setReady, 1);

      expect(healthClient.check).toHaveBeenCalledTimes(2);
      expect(setReady).toHaveBeenCalledWith(true);
    });

    it('stops retrying once cancelled and never calls setReady', async function() {
      healthClient.check.and.returnValue(Promise.resolve({ status: 502 }));

      const cancelToken = { cancelled: false };
      const controller = new RecoverPasswordController(setStatus, setErrorMessage, undefined, healthClient);

      const promise = controller.waitUntilReady(setReady, 5, cancelToken);

      cancelToken.cancelled = true;

      await promise;

      expect(setReady).not.toHaveBeenCalled();
    });
  });
});
