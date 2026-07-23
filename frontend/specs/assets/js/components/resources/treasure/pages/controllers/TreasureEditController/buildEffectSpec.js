import TreasureEditController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureEditController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('TreasureEditController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 1, name: 'Sword', value: 100 } }),
    );
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    let setTreasure;
    let setLoading;
    let setError;
    let treasureClient;
    let fakeWindow;

    beforeEach(function() {
      setTreasure = jasmine.createSpy('setTreasure');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      treasureClient = jasmine.createSpyObj('treasureClient', ['updateTreasure']);
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      spyOn(AccessStore, 'ensureTreasurePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      fakeWindow = { location: { hash: '#/treasures/1/edit' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new TreasureEditController(
      setTreasure, setLoading, setError, Noop.noop, treasureClient,
    );

    it('fetches treasure through RequestStore and access in parallel and calls setTreasure with merged result', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'TreasureEditController', resource: 'treasure', quantityType: 'single', params: { id: '1' },
      });
      expect(AccessStore.ensureTreasurePermissions).toHaveBeenCalledWith('1');
      expect(setTreasure).toHaveBeenCalledWith(
        { id: 1, name: 'Sword', value: 100, can_edit: true },
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets can_edit to false when the access resolves with the fail-closed default', async function() {
      AccessStore.ensureTreasurePermissions.and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).toHaveBeenCalledWith(
        jasmine.objectContaining({ can_edit: false }),
      );
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the treasure fetch fails', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('redirects to home and does not fetch when the user is neither staff nor a superuser', async function() {
      AccessStore.ensureStaffOrSuperUser.and.returnValue(Promise.resolve(false));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(ensureSpy).not.toHaveBeenCalled();
      expect(AccessStore.ensureTreasurePermissions).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
