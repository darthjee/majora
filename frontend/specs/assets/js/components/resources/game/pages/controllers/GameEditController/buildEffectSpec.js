import GameEditController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameEditController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('GameEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches the game and merges AccessStore access, calling setGame with the result', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, Noop.noop, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', null);
        expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
        expect(setGame).toHaveBeenCalledWith({ name: 'Demo', game_slug: 'demo', can_edit: true });
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets can_edit to false when AccessStore resolves with the fail-closed default', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));

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
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));

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
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const setGame = jasmine.createSpy('setGame');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/edit' } };
      globalThis.window = fakeWindow;

      AuthStorage.setToken('tok-abc');

      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
      }));

      try {
        const controller = new GameEditController(setGame, setLoading, setError, Noop.noop, gameClient);
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', 'tok-abc');
        expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });
});
