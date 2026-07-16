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
  let setVotesPayload;
  let pollClient;
  let authClient;
  let fakeWindow;

  const buildController = () => new GamePollController(
    setPoll, setLoading, setError, pollClient, setCanVote, setCanClose, setSelectedOptionIds,
    setVotesPayload, authClient
  );

  beforeEach(function() {
    setPoll = jasmine.createSpy('setPoll');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanVote = jasmine.createSpy('setCanVote');
    setCanClose = jasmine.createSpy('setCanClose');
    setSelectedOptionIds = jasmine.createSpy('setSelectedOptionIds');
    setVotesPayload = jasmine.createSpy('setVotesPayload');
    pollClient = jasmine.createSpyObj('pollClient', ['fetchPoll', 'fetchPollVotes']);
    pollClient.fetchPollVotes.and.returnValue(Promise.resolve({
      ok: true, json: () => Promise.resolve({ votes_count: [], users: [], votes: [] }),
    }));
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
    it('fetches the full, unfiltered votes payload for a voting viewer', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));
      const payload = {
        votes_count: [{ option: 10, count: 1 }, { option: 11, count: 0 }],
        users: [{ id: 42, name: 'alice', avatar_url: null }],
        votes: [{ id: 1, option: 10, user_id: 42 }],
      };
      pollClient.fetchPollVotes.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve(payload),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(pollClient.fetchPollVotes).toHaveBeenCalledWith('demo', '7', null);
      expect(setVotesPayload).toHaveBeenCalledWith(payload);

      cleanup();
    });

    it('fetches the full, unfiltered votes payload for a non-voting viewer (admin)', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: true, is_staff: false,
      }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));
      const payload = { votes_count: [{ option: 10, count: 0 }], users: [], votes: [] };
      pollClient.fetchPollVotes.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve(payload),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(pollClient.fetchPollVotes).toHaveBeenCalledWith('demo', '7', null);
      expect(setVotesPayload).toHaveBeenCalledWith(payload);

      cleanup();
    });

    it('leaves the votes payload unset when the unfiltered votes fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      pollClient.fetchPoll.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 7 }),
      }));
      pollClient.fetchPollVotes.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setVotesPayload).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
