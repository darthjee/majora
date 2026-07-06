import GameEditController from '../../../../../../../assets/js/components/pages/controllers/GameEditController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches game and access in parallel and calls setGame with merged result', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, Noop.noop, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', null);
        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
        expect(setGame).toHaveBeenCalledWith({ name: 'Demo', game_slug: 'demo', can_edit: true });
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets can_edit to false when access response is not ok', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, Noop.noop, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setGame).toHaveBeenCalledWith(
          jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
        );
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error when the game fetch fails', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, Noop.noop, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setGame).not.toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Unable to load game.');
        expect(setLoading).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sends the token when the user is authenticated', async function() {
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      AuthStorage.setToken('tok-abc');

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));
      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, Noop.noop, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', 'tok-abc');
        expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', 'tok-abc');

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });
});
