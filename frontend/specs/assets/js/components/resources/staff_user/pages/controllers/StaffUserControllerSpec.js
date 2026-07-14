import StaffUserController
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('StaffUserController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts user id from a detail hash', function() {
    expect(StaffUserController.getStaffUserIdFromHash('#/staff/users/42')).toBe('42');
  });

  it('returns an empty string when the hash does not match the detail route', function() {
    expect(StaffUserController.getStaffUserIdFromHash('#/staff/users/42/edit')).toBe('');
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
      client = jasmine.createSpyObj('client', ['fetchUser']);
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      fakeWindow = { location: { hash: '#/staff/users/1' } };
      globalThis.window = fakeWindow;
      client.fetchUser.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new StaffUserController(setUser, setLoading, setError, client);

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

    it('sets error when the id is missing from the hash', async function() {
      fakeWindow.location.hash = '#/staff/users';

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchUser).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

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
