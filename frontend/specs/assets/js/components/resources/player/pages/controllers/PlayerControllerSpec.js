import PlayerController
  from '../../../../../../../../assets/js/components/resources/player/pages/controllers/PlayerController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('PlayerController', function() {
  let setPlayer;
  let setLoading;
  let setError;
  let client;
  let playerClient;

  beforeEach(function() {
    setPlayer = jasmine.createSpy('setPlayer');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/players/7');
    playerClient = jasmine.createSpyObj('playerClient', ['fetchPlayer']);
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('.getPlayerParamsFromHash', function() {
    it('extracts the game slug and player id', function() {
      expect(PlayerController.getPlayerParamsFromHash('#/games/demo/players/7')).toEqual({
        game_slug: 'demo', id: '7',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(PlayerController.getPlayerParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches and sets the player on success', async function() {
      playerClient.fetchPlayer.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, user: null, character: null }),
      }));

      const cleanup = new PlayerController(
        setPlayer, setLoading, setError, client, undefined, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(playerClient.fetchPlayer).toHaveBeenCalledWith('demo', '7', null);
      expect(setPlayer).toHaveBeenCalledWith({ id: 7, user: null, character: null });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sends the auth token when present', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      playerClient.fetchPlayer.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, user: null, character: null }),
      }));

      const cleanup = new PlayerController(
        setPlayer, setLoading, setError, client, undefined, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(playerClient.fetchPlayer).toHaveBeenCalledWith('demo', '7', 'tok-abc');

      cleanup();
    });

    it('sets an error when the response is not ok', async function() {
      playerClient.fetchPlayer.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new PlayerController(
        setPlayer, setLoading, setError, client, undefined, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load player.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      playerClient.fetchPlayer.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new PlayerController(
        setPlayer, setLoading, setError, client, undefined, playerClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load player.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new PlayerController(
        setPlayer, setLoading, setError, client, undefined, playerClient,
      ).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load player.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(playerClient.fetchPlayer).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      playerClient.fetchPlayer.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 7, user: null, character: null }),
      }));

      const cleanup = new PlayerController(
        setPlayer, setLoading, setError, client, undefined, playerClient,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPlayer).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
