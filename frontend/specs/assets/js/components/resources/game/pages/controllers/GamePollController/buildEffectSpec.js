import GamePollController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GamePollController', function() {
  let setPoll;
  let setLoading;
  let setError;
  let setCanVote;
  let setCanClose;
  let setSelectedOptionIds;
  let setVotesPayload;
  let authClient;
  let fakeWindow;
  let ensureSpy;

  const buildController = () => new GamePollController(
    setPoll, setLoading, setError, setCanVote, setCanClose, setSelectedOptionIds,
    setVotesPayload, authClient
  );

  const stubEnsure = (poll = { id: 7 }, votesPayload = { votes_count: [], users: [], votes: [] }) => {
    ensureSpy.and.callFake(({ quantityType }) => {
      if (quantityType === 'single') {
        return Promise.resolve({ data: poll });
      }
      return Promise.resolve({ data: votesPayload });
    });
  };

  beforeEach(function() {
    setPoll = jasmine.createSpy('setPoll');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanVote = jasmine.createSpy('setCanVote');
    setCanClose = jasmine.createSpy('setCanClose');
    setSelectedOptionIds = jasmine.createSpy('setSelectedOptionIds');
    setVotesPayload = jasmine.createSpy('setVotesPayload');
    authClient = jasmine.createSpyObj('authClient', ['status']);
    authClient.status.and.returnValue(Promise.resolve({ ok: false }));
    ensureSpy = spyOn(RequestStore, 'ensure');
    stubEnsure();
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
      stubEnsure({
        id: 7, title: 'Which tavern?', description: '', type: 'single', status: 'open', options: [],
      });

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GamePollController',
        resource: 'poll',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '7' },
      });
      expect(setPoll).toHaveBeenCalledWith(jasmine.objectContaining({ id: 7, game_slug: 'demo' }));
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('marks the viewer as able to vote when they are a player', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanVote).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks the viewer as able to vote when they are a DM', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanVote).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks a pure admin viewer as unable to vote', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: true, is_staff: false,
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanVote).toHaveBeenCalledWith(false);
      expect(authClient.status).not.toHaveBeenCalled();
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GamePollController',
        resource: 'poll',
        quantityType: 'votes',
        params: { gameSlug: 'demo', id: '7' },
      });

      cleanup();
    });

    it('marks the viewer as able to close the poll when they are a DM', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('marks the viewer as able to close the poll when they are a superuser', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: true, is_staff: false,
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

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('marks a pure staff viewer unable to close the poll', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: false, is_staff: true,
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanClose).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('pre-fetches the current user\'s votes, filtered by their user id, when they can vote', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      authClient.status.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ user_id: 42 }),
      }));
      ensureSpy.and.callFake(({ quantityType, query }) => {
        if (quantityType === 'single') {
          return Promise.resolve({ data: { id: 7 } });
        }
        if (query) {
          return Promise.resolve({
            data: {
              votes_count: [{ option: 10, count: 1 }, { option: 11, count: 1 }],
              users: [{ id: 42, name: 'alice', avatar_url: null }],
              votes: [{ id: 1, option: 10, user_id: 42 }, { id: 2, option: 11, user_id: 42 }],
            },
          });
        }
        return Promise.resolve({ data: { votes_count: [], users: [], votes: [] } });
      });

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(authClient.status).toHaveBeenCalledWith(null);
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GamePollController',
        resource: 'poll',
        quantityType: 'votes',
        params: { gameSlug: 'demo', id: '7' },
        query: { user_id: '42' },
      });
      expect(setSelectedOptionIds).toHaveBeenCalledWith([10, 11]);

      cleanup();
    });

    it('leaves the selection empty when the votes pre-fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
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
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('redirects to the game page when the access request throws', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the poll fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));
      ensureSpy.and.callFake(({ quantityType }) => (
        quantityType === 'single'
          ? Promise.reject(new Error('network error'))
          : Promise.resolve({ data: { votes_count: [], users: [], votes: [] } })
      ));

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
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_dm: true }));

      const cleanup = buildController().buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPoll).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
