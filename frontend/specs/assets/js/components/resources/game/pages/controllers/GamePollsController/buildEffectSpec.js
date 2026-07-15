import GamePollsController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GamePollsController', function() {
  let setPolls;
  let setPagination;
  let setLoading;
  let setError;
  let pollClient;
  let fakeWindow;

  beforeEach(function() {
    setPolls = jasmine.createSpy('setPolls');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    pollClient = jasmine.createSpyObj('pollClient', ['fetchPolls']);
    fakeWindow = { location: { hash: '#/games/demo/polls' } };
    globalThis.window = fakeWindow;
  });

  afterEach(function() {
    delete globalThis.window;
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches polls and pagination when the user is a DM', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: true, is_player: false, is_superuser: false, is_staff: false,
      }));
      const headers = new Map([['page', '1'], ['pages', '2'], ['per_page', '10']]);
      pollClient.fetchPolls.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, title: 'Which tavern?', type: 'single', status: 'open' }]),
        headers: { get: (key) => headers.get(key) },
      }));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(pollClient.fetchPolls).toHaveBeenCalledWith('demo', null, jasmine.any(URLSearchParams));
      expect(setPolls).toHaveBeenCalledWith([{ id: 1, title: 'Which tavern?', type: 'single', status: 'open' }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 2, perPage: 10 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('fetches polls when the user is a player', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: true, is_superuser: false, is_staff: false,
      }));
      pollClient.fetchPolls.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]), headers: { get: () => null },
      }));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(pollClient.fetchPolls).toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the user is not a DM, player, superuser, or staff', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: false, is_staff: false,
      }));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(pollClient.fetchPolls).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(pollClient.fetchPolls).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the polls fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPolls.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load polls.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the response is not ok', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPolls.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load polls.');

      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPolls.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]), headers: { get: () => null },
      }));

      const cleanup = new GamePollsController(
        setPolls, setPagination, setLoading, setError, pollClient,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPolls).not.toHaveBeenCalled();
      expect(setPagination).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
