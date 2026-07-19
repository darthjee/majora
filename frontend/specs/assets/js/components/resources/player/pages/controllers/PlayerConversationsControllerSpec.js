import PlayerConversationsController, { CONV_PAGE_PARAM }
  from '../../../../../../../../assets/js/components/resources/player/pages/controllers/PlayerConversationsController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('PlayerConversationsController', function() {
  let setConversations;
  let setPagination;
  let setLoading;
  let setError;
  let client;
  let playerClient;

  beforeEach(function() {
    setConversations = jasmine.createSpy('setConversations');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/players/7');
    playerClient = jasmine.createSpyObj('playerClient', ['fetchConversations']);
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('exposes the conv_page query param name', function() {
    expect(CONV_PAGE_PARAM).toBe('conv_page');
  });

  describe('#buildEffect', function() {
    it('fetches and sets conversations and pagination on success', async function() {
      const headers = new Map([['page', '1'], ['pages', '2'], ['per_page', '10']]);
      playerClient.fetchConversations.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, title: 'Session 1 recap' }]),
        headers: { get: (key) => headers.get(key) },
      }));

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(playerClient.fetchConversations).toHaveBeenCalledWith(
        'demo', '7', null, jasmine.any(URLSearchParams),
      );
      expect(setConversations).toHaveBeenCalledWith([{ id: 1, title: 'Session 1 recap' }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 2, perPage: 10 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('passes the conv_page hash query param through as the page param', async function() {
      client.currentHash.and.returnValue('#/games/demo/players/7?conv_page=3');
      playerClient.fetchConversations.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        headers: { get: () => null },
      }));

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const [, , , params] = playerClient.fetchConversations.calls.mostRecent().args;
      expect(params.get('page')).toBe('3');

      cleanup();
    });

    it('defaults to an empty array when the response data is not an array', async function() {
      playerClient.fetchConversations.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
        headers: { get: () => null },
      }));

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setConversations).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('sets an error when the response is not ok', async function() {
      playerClient.fetchConversations.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load conversations.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      playerClient.fetchConversations.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load conversations.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load conversations.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(playerClient.fetchConversations).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      playerClient.fetchConversations.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        headers: { get: () => null },
      }));

      const cleanup = new PlayerConversationsController(
        setConversations, setPagination, setLoading, setError, client, playerClient,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setConversations).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
