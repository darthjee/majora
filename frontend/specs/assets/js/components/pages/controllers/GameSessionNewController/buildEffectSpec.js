import GameSessionNewController
  from '../../../../../../../assets/js/components/pages/controllers/GameSessionNewController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameSessionNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user can edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
        expect(fakeWindow.location.hash).toBe('#/games/demo/sessions/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the sessions index when the user cannot edit the game', async function() {
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the sessions index when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const sessionClient = jasmine.createSpyObj('sessionClient', ['createSession']);
      const fakeWindow = { location: { hash: '#/games/demo/sessions/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GameSessionNewController(setError, Noop.noop, sessionClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/sessions');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
