import GamePollNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GamePollNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('does not redirect when the user is a DM, player, superuser, or staff', async function() {
      const setError = jasmine.createSpy('setError');
      const pollClient = jasmine.createSpyObj('pollClient', ['createPoll']);
      const fakeWindow = { location: { hash: '#/games/demo/polls/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));

      try {
        const controller = new GamePollNewController(setError, Noop.noop, pollClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
        expect(fakeWindow.location.hash).toBe('#/games/demo/polls/new');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the polls list when the user is not allowed', async function() {
      const setError = jasmine.createSpy('setError');
      const pollClient = jasmine.createSpyObj('pollClient', ['createPoll']);
      const fakeWindow = { location: { hash: '#/games/demo/polls/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: false, is_staff: false,
      }));

      try {
        const controller = new GamePollNewController(setError, Noop.noop, pollClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/polls');
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the polls list when the access request throws', async function() {
      const setError = jasmine.createSpy('setError');
      const pollClient = jasmine.createSpyObj('pollClient', ['createPoll']);
      const fakeWindow = { location: { hash: '#/games/demo/polls/new' } };
      globalThis.window = fakeWindow;

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      try {
        const controller = new GamePollNewController(setError, Noop.noop, pollClient);
        controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/games/demo/polls');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
