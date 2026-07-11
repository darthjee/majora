import TreasureEditController
  from '../../../../../../../assets/js/components/pages/controllers/TreasureEditController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('TreasureEditController', function() {
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
      treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasure']);
      spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(true));
      spyOn(AccessStore, 'ensureTreasureAccess').and.returnValue(Promise.resolve({ can_edit: true }));
      fakeWindow = { location: { hash: '#/treasures/1/edit' } };
      globalThis.window = fakeWindow;
      treasureClient.fetchTreasure.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Sword', value: 100 }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new TreasureEditController(
      setTreasure, setLoading, setError, Noop.noop, treasureClient,
    );

    it('fetches treasure and access in parallel and calls setTreasure with merged result', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(treasureClient.fetchTreasure).toHaveBeenCalledWith('1', null);
      expect(AccessStore.ensureTreasureAccess).toHaveBeenCalledWith('1');
      expect(setTreasure).toHaveBeenCalledWith(
        { id: 1, name: 'Sword', value: 100, can_edit: true },
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets can_edit to false when the access resolves with the fail-closed default', async function() {
      AccessStore.ensureTreasureAccess.and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).toHaveBeenCalledWith(
        jasmine.objectContaining({ can_edit: false }),
      );
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the treasure fetch fails', async function() {
      treasureClient.fetchTreasure.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(treasureClient.fetchTreasure).toHaveBeenCalledWith('1', 'tok-abc');
      expect(AccessStore.ensureTreasureAccess).toHaveBeenCalledWith('1');

      cleanup();
    });

    it('redirects to home and does not fetch when the user is not a superuser', async function() {
      AccessStore.ensureSuperUser.and.returnValue(Promise.resolve(false));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(treasureClient.fetchTreasure).not.toHaveBeenCalled();
      expect(AccessStore.ensureTreasureAccess).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
