import GameController from '../../../../../../../assets/js/components/pages/controllers/GameController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildGameClient } from './support.js';

describe('GameController', function() {
  let gameClient;

  beforeEach(function() {
    gameClient = buildGameClient();
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('merges can_edit from the access endpoint onto the game object', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: true }),
    );

    cleanup();
  });

  it('sets can_edit to false when the access fetch fails', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
    );
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets can_edit to false when the access response is not ok', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
    );

    cleanup();
  });
});
