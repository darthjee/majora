import StaffUserEditController
  from '../../../../../../../assets/js/components/pages/controllers/StaffUserEditController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('StaffUserEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    let setUser;
    let setLoading;
    let setError;
    let client;
    let fakeWindow;

    beforeEach(function() {
      setUser = jasmine.createSpy('setUser');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      client = jasmine.createSpyObj('client', ['fetchUser', 'updateUser']);
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      fakeWindow = { location: { hash: '#/staff/users/1/edit' } };
      globalThis.window = fakeWindow;
      client.fetchUser.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new StaffUserEditController(
      setUser, setLoading, setError, Noop.noop, client,
    );

    it('fetches the user and calls setUser with the result', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchUser).toHaveBeenCalledWith('1', null);
      expect(setUser).toHaveBeenCalledWith({ id: 1, name: 'Jane', email: 'jane@example.com' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the user fetch fails', async function() {
      client.fetchUser.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setUser).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchUser).toHaveBeenCalledWith('1', 'tok-abc');

      cleanup();
    });

    it('redirects to home and does not fetch when the user is neither staff nor superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(client.fetchUser).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
