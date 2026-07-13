import RegisterController from '../../../../../../../../assets/js/components/resources/account/pages/controllers/RegisterController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/AuthStorage.js';
import AuthEvents from '../../../../../../../../assets/js/utils/AuthEvents.js';

describe('RegisterController', function() {
  describe('#handleSubmit', function() {
    let setStatus;
    let client;

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      client = jasmine.createSpyObj('client', ['register']);
      spyOn(AuthStorage, 'setToken');
      spyOn(AuthEvents, 'emit');
    });

    it('stores the token, emits auth-changed, and redirects home on success', async function() {
      client.register.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ username: 'jane', token: 'tok-abc' }),
      }));

      const controller = new RegisterController(setStatus, client);
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

    it('marks an error without leaking the raw server message when the request fails', async function() {
      client.register.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Email is already taken' }),
      }));

      const controller = new RegisterController(setStatus, client);

      await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(AuthStorage.setToken).not.toHaveBeenCalled();
    });

    it('marks an error when the server omits a message', async function() {
      client.register.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }));

      const controller = new RegisterController(setStatus, client);

      await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('marks an unexpected error when the client rejects', async function() {
      client.register.and.returnValue(Promise.reject(new Error('network')));

      const controller = new RegisterController(setStatus, client);

      await controller.handleSubmit('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
