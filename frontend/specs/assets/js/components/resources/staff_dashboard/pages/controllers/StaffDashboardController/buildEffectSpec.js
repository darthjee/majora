import StaffDashboardController from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/controllers/StaffDashboardController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('StaffDashboardController', function() {
  let setLoading;
  let setError;
  let client;

  beforeEach(function() {
    ({ setLoading, setError, client } = buildContext());
  });

  describe('#buildEffect', function() {
    it('clears loading when the user is staff or superuser', async function() {
      stubAccessStore(true);

      const cleanup = new StaffDashboardController(setLoading, setError, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to home and does not clear loading when the user is neither staff nor superuser', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        const cleanup = new StaffDashboardController(setLoading, setError, client).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
        expect(setLoading).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error when the access check fails', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new StaffDashboardController(setLoading, setError, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load dashboard.');

      cleanup();
    });
  });
});
