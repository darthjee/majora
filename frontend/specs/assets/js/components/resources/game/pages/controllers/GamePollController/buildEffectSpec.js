import GamePollController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GamePollController', function() {
  let setPoll;
  let setLoading;
  let setError;
  let pollClient;
  let fakeWindow;

  beforeEach(function() {
    setPoll = jasmine.createSpy('setPoll');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    pollClient = jasmine.createSpyObj('pollClient', ['fetchPoll']);
    fakeWindow = { location: { hash: '#/games/demo/polls/7' } };
    globalThis.window = fakeWindow;
  });

  afterEach(function() {
    delete globalThis.window;
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches the poll when the user is a DM, player, superuser, or staff', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 7, title: 'Which tavern?', description: '', type: 'single', status: 'open', options: [],
        }),
      }));

      const cleanup = new GamePollController(setPoll, setLoading, setError, pollClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(pollClient.fetchPoll).toHaveBeenCalledWith('demo', '7', null);
      expect(setPoll).toHaveBeenCalledWith(jasmine.objectContaining({ id: 7, game_slug: 'demo' }));
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the user is not allowed', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: false, is_staff: false,
      }));

      const cleanup = new GamePollController(setPoll, setLoading, setError, pollClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(pollClient.fetchPoll).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GamePollController(setPoll, setLoading, setError, pollClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(pollClient.fetchPoll).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the poll fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPoll.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GamePollController(setPoll, setLoading, setError, pollClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load poll.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the hash has no game slug or id', async function() {
      globalThis.window = { location: { hash: '#/other' } };

      const cleanup = new GamePollController(setPoll, setLoading, setError, pollClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load poll.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(pollClient.fetchPoll).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = new GamePollController(setPoll, setLoading, setError, pollClient).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPoll).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
