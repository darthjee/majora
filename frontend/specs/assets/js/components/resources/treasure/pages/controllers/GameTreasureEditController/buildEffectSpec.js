import GameTreasureEditController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureEditController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameTreasureEditController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 42, name: 'Sword', value: 100, game_slug: 'demo' } }),
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
      treasureClient = jasmine.createSpyObj('treasureClient', ['updateGameTreasure']);
      fakeWindow = { location: { hash: '#/games/demo/treasures/42/edit' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new GameTreasureEditController(
      setTreasure, setLoading, setError, Noop.noop, treasureClient,
    );

    it('fetches the game-scoped treasure through RequestStore and calls setTreasure when the user can edit', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(ensureSpy).toHaveBeenCalledWith({
        resource: 'treasure', quantityType: 'single', params: { gameSlug: 'demo', id: '42' },
      });
      expect(setTreasure).toHaveBeenCalledWith(
        { id: 42, name: 'Sword', value: 100, game_slug: 'demo' },
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the treasures index and does not fetch when the user cannot edit', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the treasures index when the access request throws', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      expect(ensureSpy).not.toHaveBeenCalled();

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
  });
});
