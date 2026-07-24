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
  let ensureSpy;
  let fakeWindow;

  const buildController = () => new GamePollController(
    setPoll, setLoading, setError, setCanVote, setCanClose, setSelectedOptionIds,
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
    authClient = jasmine.createSpyObj('authClient', ['status']);
    authClient.status.and.returnValue(Promise.resolve({ ok: false }));
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 7 } }));
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
      const payload = {
        votes_count: [{ option: 10, count: 1 }, { option: 11, count: 0 }],
        users: [{ id: 42, name: 'alice', avatar_url: null }],
        votes: [{ id: 1, option: 10, user_id: 42 }],
      };
      ensureSpy.and.callFake(({ quantityType }) => (
        quantityType === 'single' ? Promise.resolve({ data: { id: 7 } }) : Promise.resolve({ data: payload })
      ));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GamePollController',
        resource: 'poll',
        quantityType: 'votes',
        params: { gameSlug: 'demo', id: '7' },
      });
      expect(setVotesPayload).toHaveBeenCalledWith(payload);

      cleanup();
    });

    it('fetches the full, unfiltered votes payload for a non-voting viewer (admin)', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({
        is_dm: false, is_player: false, is_superuser: true, is_staff: false,
      }));
      const payload = { votes_count: [{ option: 10, count: 0 }], users: [], votes: [] };
      ensureSpy.and.callFake(({ quantityType }) => (
        quantityType === 'single' ? Promise.resolve({ data: { id: 7 } }) : Promise.resolve({ data: payload })
      ));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GamePollController',
        resource: 'poll',
        quantityType: 'votes',
        params: { gameSlug: 'demo', id: '7' },
      });
      expect(setVotesPayload).toHaveBeenCalledWith(payload);

      cleanup();
    });

    it('leaves the votes payload unset when the unfiltered votes fetch fails', async function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      ensureSpy.and.callFake(({ quantityType }) => (
        quantityType === 'single' ? Promise.resolve({ data: { id: 7 } }) : Promise.reject(new Error('network error'))
      ));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setVotesPayload).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
