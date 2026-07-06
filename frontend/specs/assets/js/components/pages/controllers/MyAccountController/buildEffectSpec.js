import MyAccountController from '../../../../../../../assets/js/components/pages/controllers/MyAccountController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('MyAccountController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    let setName;
    let setEmail;
    let setLoading;
    let client;
    let fakeWindow;

    beforeEach(function() {
      setName = jasmine.createSpy('setName');
      setEmail = jasmine.createSpy('setEmail');
      setLoading = jasmine.createSpy('setLoading');
      client = jasmine.createSpyObj('client', ['fetchAccount', 'updateAccount']);
      fakeWindow = { location: { hash: '#/my_account' } };
      globalThis.window = fakeWindow;
      client.fetchAccount.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new MyAccountController(setName, setEmail, setLoading, client);

    it('fetches the account and prefills name/email', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchAccount).toHaveBeenCalledWith(null);
      expect(setName).toHaveBeenCalledWith('Jane');
      expect(setEmail).toHaveBeenCalledWith('jane@example.com');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchAccount).toHaveBeenCalledWith('tok-abc');

      cleanup();
    });

    it('redirects to home when the account fetch fails', async function() {
      client.fetchAccount.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(setName).not.toHaveBeenCalled();
      expect(setEmail).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('redirects to home when the account fetch throws', async function() {
      client.fetchAccount.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');

      cleanup();
    });
  });
});
