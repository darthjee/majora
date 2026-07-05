import GameController, { getGameSlugFromHash }
  from '../../../../../../assets/js/components/pages/controllers/GameController.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('GameController', function() {
  let gameClient;

  beforeEach(function() {
    gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts game slug from hash', function() {
    expect(getGameSlugFromHash('#/games/demo')).toBe('demo');
  });

  it('uses route params to request game detail', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.resolve([{ id: 1, name: 'Aragorn' }]);
      }
      if (path.startsWith('/games/demo/npcs.json')) {
        return Promise.resolve([{ id: 2, name: 'Gandalf' }]);
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo.json');
    expect(setGame).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
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

  it('fetches the PCs preview list alongside the game', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    const pcs = [{ id: 1, name: 'Aragorn' }];

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.resolve(pcs);
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo/pcs.json?per_page=6');
    expect(setPcs).toHaveBeenCalledWith(pcs);

    cleanup();
  });

  it('fetches the NPCs preview list alongside the game', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    const npcs = [{ id: 2, name: 'Gandalf' }];

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/npcs.json')) {
        return Promise.resolve(npcs);
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo/npcs.json?per_page=6');
    expect(setNpcs).toHaveBeenCalledWith(npcs);

    cleanup();
  });

  it('sets an empty PCs list and still renders the game when the PCs fetch fails', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setPcs).toHaveBeenCalledWith([]);
    expect(setGame).toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an empty NPCs list and still renders the game when the NPCs fetch fails', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/npcs.json')) {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client, gameClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setNpcs).toHaveBeenCalledWith([]);
    expect(setGame).toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  describe('NPCs preview auth fetch', function() {
    const publicNpcs = [{ id: 2, name: 'Gandalf' }];
    let setNpcs;
    let client;
    let characterClient;

    beforeEach(function() {
      setNpcs = jasmine.createSpy('setNpcs');
      client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
      characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
      client.currentHash.and.returnValue('#/games/demo');
      client.fetch.and.callFake((path) => {
        if (path.startsWith('/games/demo/npcs.json')) {
          return Promise.resolve(publicNpcs);
        }
        return Promise.resolve({ game_slug: 'demo' });
      });
    });

    function makeController() {
      return new GameController(
        jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(),
        Noop.noop, setNpcs, client, gameClient, characterClient,
      );
    }

    it('skips the auth fetch when no token is stored', async function() {
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
      expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
      cleanup();
    });

    it('uses the authenticated NPC list when the auth fetch succeeds', async function() {
      const authNpcs = [{ id: 99, name: 'Hidden NPC' }];
      characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(authNpcs),
      }));
      AuthStorage.setToken('mytoken');
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(setNpcs).toHaveBeenCalledWith(authNpcs);
      cleanup();
    });

    it('falls back to public when the auth fetch returns a non-ok response', async function() {
      characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({ ok: false }));
      AuthStorage.setToken('mytoken');
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
      cleanup();
    });

    it('falls back to public when the auth fetch rejects', async function() {
      characterClient.fetchNpcsAll.and.returnValue(Promise.reject(new Error('network error')));
      AuthStorage.setToken('mytoken');
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
      cleanup();
    });
  });
});
