import GameTreasureNewController
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasureNewController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameTreasureNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
        expect(fakeWindow.location.hash).toBe('#/games/demo/treasures/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasures index when the user cannot edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: false }),
      }));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasures index when the access response is not ok', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasures index when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
      const treasureClient = jasmine.createSpyObj('treasureClient', ['createGameTreasure']);
      const fakeWindow = { location: { hash: '#/games/demo/treasures/new' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GameTreasureNewController(setError, Noop.noop, treasureClient, gameClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/treasures');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
