import GameTreasureNewController
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasureNewController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameTreasureNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
        expect(fakeWindow.location.hash).toBe('#/games/demo/treasures/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasures index when the user cannot edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasures index when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
