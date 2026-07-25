import StaffUserEditController
  from '../../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserEditController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffUserEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    let setUser;
    let setLoading;
    let setError;
    let ensureSpy;
    let fakeWindow;

    beforeEach(function() {
      setUser = jasmine.createSpy('setUser');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      fakeWindow = { location: { hash: '#/staff/users/1/edit' } };
      globalThis.window = fakeWindow;
      ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: { id: 1, name: 'Jane', email: 'jane@example.com' },
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new StaffUserEditController(
      setUser, setLoading, setError, Noop.noop,
    );

    it('fetches the user through RequestStore and calls setUser with the result', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUserEditController', resource: 'staffUser', quantityType: 'single', params: { id: '1' },
      });
      expect(setUser).toHaveBeenCalledWith({ id: 1, name: 'Jane', email: 'jane@example.com' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the user fetch fails', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setUser).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('redirects to home and does not fetch when the user is neither staff nor superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
