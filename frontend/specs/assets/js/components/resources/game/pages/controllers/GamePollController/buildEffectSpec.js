import GamePollController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GamePollController', function() {
  let setPoll;
  let setLoading;
  let setError;
  let setCanVote;
  let setCanClose;
  let setSelectedOptionIds;
  let pollClient;
  let authClient;
  let fakeWindow;

  const buildController = () => new GamePollController(
    setPoll, setLoading, setError, pollClient, setCanVote, setCanClose, setSelectedOptionIds, authClient
  );

  beforeEach(function() {
    setPoll = jasmine.createSpy('setPoll');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanVote = jasmine.createSpy('setCanVote');
    setCanClose = jasmine.createSpy('setCanClose');
    setSelectedOptionIds = jasmine.createSpy('setSelectedOptionIds');
    pollClient = jasmine.createSpyObj('pollClient', ['fetchPoll', 'fetchPollVotes']);
    authClient = jasmine.createSpyObj('authClient', ['status']);
    authClient.status.and.returnValue(Promise.resolve({ ok: false }));
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

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(pollClient.fetchPoll).toHaveBeenCalledWith('demo', '7', null);
      expect(setPoll).toHaveBeenCalledWith(jasmine.objectContaining({ id: 7, game_slug: 'demo' }));
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('marks the viewer as able to vote when they are a player', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanVote).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks the viewer as able to vote when they are a DM', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanVote).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks a pure admin viewer as unable to vote', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: true, is_staff: false,
      }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanVote).toHaveBeenCalledWith(false);
      expect(authClient.status).not.toHaveBeenCalled();
      expect(pollClient.fetchPollVotes).not.toHaveBeenCalled();

      cleanup();
    });

    it('marks the viewer as able to close the poll when they are a DM', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks the viewer as able to close the poll when they are a superuser', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: true, is_staff: false,
      }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks a player unable to close the poll', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: true, is_superuser: false, is_staff: false,
      }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('marks a pure staff viewer unable to close the poll', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: false, is_staff: true,
      }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('pre-fetches the current user\'s votes, filtered by their user id, when they can vote', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));
      authClient.status.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ user_id: 42 }),
      }));
      pollClient.fetchPollVotes.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, option: 10, user: 42 }, { id: 2, option: 11, user: 42 }]),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(authClient.status).toHaveBeenCalledWith(null);
      expect(pollClient.fetchPollVotes).toHaveBeenCalledWith(
        'demo', '7', null, new URLSearchParams({ user_id: '42' })
      );
      expect(setSelectedOptionIds).toHaveBeenCalledWith([10, 11]);

      cleanup();
    });

    it('leaves the selection empty when the votes pre-fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));
      authClient.status.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setSelectedOptionIds).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the user is not allowed', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: false, is_staff: false,
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(pollClient.fetchPoll).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(pollClient.fetchPoll).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the poll fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      pollClient.fetchPoll.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load poll.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the hash has no game slug or id', async function() {
      globalThis.window = { location: { hash: '#/other' } };

      const cleanup = buildController().buildEffect()();
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

      const cleanup = buildController().buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPoll).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
