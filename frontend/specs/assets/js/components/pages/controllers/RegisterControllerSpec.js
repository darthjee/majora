import RegisterController from '../../../../../../assets/js/components/pages/controllers/RegisterController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';
import AuthEvents from '../../../../../../assets/js/utils/AuthEvents.js';

describe('RegisterController', function() {
  describe('#handleSubmit', function() {
    let setStatus;
    let setErrorMessage;
    let client;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setErrorMessage = jasmine.createSpy('setErrorMessage');
      client = jasmine.createSpyObj('client', ['register']);
      spyOn(AuthStorage, 'setToken');
      spyOn(AuthEvents, 'emit');
    });

    it('stores the token, emits auth-changed, and redirects home on success', async function() {
      client.register.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ username: 'jane', token: 'tok-abc' }),
      }));

      const controller = new RegisterController(setStatus, setErrorMessage, client);
      const fakeWindow = { location: { hash: '' } };

      globalThis.window = fakeWindow;

      try {
        await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

        expect(client.register).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'secret', 'secret');
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(AuthStorage.setToken).toHaveBeenCalledWith('tok-abc');
        expect(AuthEvents.emit).toHaveBeenCalledWith(true);
        expect(setStatus).toHaveBeenCalledWith('success');
        expect(fakeWindow.location.hash).toBe('/');
      } finally {
        delete globalThis.window;
      }
    });

    it('surfaces the server error message when the request fails', async function() {
      client.register.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Email is already taken' }),
      }));

      const controller = new RegisterController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('Email is already taken');
      expect(AuthStorage.setToken).not.toHaveBeenCalled();
    });

    it('falls back to a generic error message when the server omits one', async function() {
      client.register.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }));

      const controller = new RegisterController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('An unexpected error occurred, please try again later.');
    });

    it('marks an unexpected error when the client rejects', async function() {
      client.register.and.returnValue(Promise.reject(new Error('network')));

      const controller = new RegisterController(setStatus, setErrorMessage, client);

      await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setErrorMessage).toHaveBeenCalledWith('An unexpected error occurred, please try again later.');
    });
  });
});
