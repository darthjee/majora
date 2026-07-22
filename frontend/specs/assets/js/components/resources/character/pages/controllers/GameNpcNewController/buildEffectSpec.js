import GameNpcNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameNpcNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ game_slug: 'demo', game_type: 'dnd' }),
      }));

      try {
        const controller = new GameNpcNewController(
          setError, Noop.noop, characterClient, Noop.noop, Noop.noop, gameClient,
        );
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
        expect(fakeWindow.location.hash).toBe('#/games/demo/npcs/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the NPCs index when the user cannot edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ game_slug: 'demo', game_type: 'dnd' }),
      }));

      try {
        const controller = new GameNpcNewController(
          setError, Noop.noop, characterClient, Noop.noop, Noop.noop, gameClient,
        );
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the NPCs index when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));
      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ game_slug: 'demo', game_type: 'dnd' }),
      }));

      try {
        const controller = new GameNpcNewController(
          setError, Noop.noop, characterClient, Noop.noop, Noop.noop, gameClient,
        );
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs');
      } finally {
        delete globalThis.window;
      }
    });

    it('fetches and applies the containing game\'s currency type', async function() {
      const setError = jasmine.createSpy('setError');
      const setGameType = jasmine.createSpy('setGameType');
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      gameClient.fetchGame.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ game_slug: 'demo', game_type: 'deadlands' }),
      }));

      try {
        const controller = new GameNpcNewController(
          setError, Noop.noop, characterClient, Noop.noop, setGameType, gameClient,
        );
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(gameClient.fetchGame).toHaveBeenCalledWith('demo', null);
        expect(setGameType).toHaveBeenCalledWith('deadlands');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
