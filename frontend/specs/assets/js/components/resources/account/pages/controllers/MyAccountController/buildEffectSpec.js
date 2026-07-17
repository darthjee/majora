import MyAccountController from '../../../../../../../../../assets/js/components/resources/account/pages/controllers/MyAccountController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('MyAccountController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    let setName;
    let setFirstName;
    let setLastName;
    let setEmail;
    let setAvatarUrl;
    let setLoading;
    let client;
    let fakeWindow;

    beforeEach(function() {
      setName = jasmine.createSpy('setName');
      setFirstName = jasmine.createSpy('setFirstName');
      setLastName = jasmine.createSpy('setLastName');
      setEmail = jasmine.createSpy('setEmail');
      setAvatarUrl = jasmine.createSpy('setAvatarUrl');
      setLoading = jasmine.createSpy('setLoading');
      client = jasmine.createSpyObj('client', ['fetchAccount', 'updateAccount']);
      fakeWindow = { location: { hash: '#/my_account' } };
      globalThis.window = fakeWindow;
      client.fetchAccount.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          name: 'Jane', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
          avatar_url: 'http://example.com/avatar.png',
        }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new MyAccountController(
      setName, setFirstName, setLastName, setEmail, setAvatarUrl, setLoading, client,
    );

    it('fetches the account and prefills name/firstName/lastName/email/avatarUrl', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchAccount).toHaveBeenCalledWith(null);
      expect(setName).toHaveBeenCalledWith('Jane');
      expect(setFirstName).toHaveBeenCalledWith('Jane');
      expect(setLastName).toHaveBeenCalledWith('Doe');
      expect(setEmail).toHaveBeenCalledWith('jane@example.com');
      expect(setAvatarUrl).toHaveBeenCalledWith('http://example.com/avatar.png');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('prefills avatarUrl with null when the account has none', async function() {
      client.fetchAccount.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Jane', email: 'jane@example.com' }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setAvatarUrl).toHaveBeenCalledWith(null);

      cleanup();
    });

    it('prefills firstName/lastName with empty strings when the account has none', async function() {
      client.fetchAccount.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Jane', email: 'jane@example.com' }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFirstName).toHaveBeenCalledWith('');
      expect(setLastName).toHaveBeenCalledWith('');

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
