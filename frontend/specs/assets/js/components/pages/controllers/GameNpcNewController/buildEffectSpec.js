import GameNpcNewController
  from '../../../../../../../assets/js/components/pages/controllers/GameNpcNewController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameNpcNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient);
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
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient);
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
      const fakeWindow = { location: { hash: '#/games/demo/npcs/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GameNpcNewController(setError, Noop.noop, characterClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/npcs');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
