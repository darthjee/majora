import GameNpcsController
  from '../../../../../../../assets/js/components/pages/controllers/GameNpcsController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameNpcsController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('uses route params to request game npcs', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = new GameNpcsController(
      setNpcs,
      setPagination,
      setLoading,
      setError,
      client,
      null,
      undefined,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(setNpcs).toHaveBeenCalledWith([{ id: 1 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('skips the auth fetch when no token is stored', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    const publicNpcs = [{ id: 1 }];
    const pagination = { page: 1, pages: 2, perPage: 10 };

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: publicNpcs, pagination }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
    expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
    expect(setPagination).toHaveBeenCalledWith(pagination);

    cleanup();
  });

  it('uses the authenticated NPC list when the auth fetch succeeds', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    const authNpcs = [{ id: 10, name: 'Hidden NPC' }];
    const publicPagination = { page: 1, pages: 2, perPage: 10 };
    const authHeaders = { page: '3', pages: '5', per_page: '20' };

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: [{ id: 1 }], pagination: publicPagination }));
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve(authNpcs),
      headers: { get: (key) => authHeaders[key] ?? null },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcsAll).toHaveBeenCalledWith('demo', 'mytoken', {});
    expect(setNpcs).toHaveBeenCalledWith(authNpcs);
    expect(setPagination).toHaveBeenCalledWith({ page: 3, pages: 5, perPage: 20 });
    expect(setPagination).not.toHaveBeenCalledWith(publicPagination);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('forwards the current page/per_page to both the public and authenticated NPC requests', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    const authNpcs = [{ id: 10, name: 'Hidden NPC' }];
    const authHeaders = { page: '2', pages: '4', per_page: '16' };

    client.currentHash.and.returnValue('#/games/demo/npcs?page=2&per_page=16');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1 }],
      pagination: { page: 2, pages: 4, perPage: 16 },
    }));
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve(authNpcs),
      headers: { get: (key) => authHeaders[key] ?? null },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', {});
    expect(characterClient.fetchNpcsAll).toHaveBeenCalledWith('demo', 'mytoken', { page: '2', per_page: '16' });
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 4, perPage: 16 });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('forwards active slain/name filters to both the public and authenticated NPC requests', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    const authNpcs = [{ id: 10, name: 'Hidden NPC' }];
    const authHeaders = { page: '1', pages: '1', per_page: '10' };

    client.currentHash.and.returnValue('#/games/demo/npcs?slain=true&name=gob');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve(authNpcs),
      headers: { get: (key) => authHeaders[key] ?? null },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs.json', { slain: 'true', name: 'gob' });
    expect(characterClient.fetchNpcsAll).toHaveBeenCalledWith(
      'demo', 'mytoken', { slain: 'true', name: 'gob' },
    );
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('falls back to the public NPC list when the auth fetch returns a non-ok response', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    const publicNpcs = [{ id: 1 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: publicNpcs, pagination }));
    characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
    expect(setPagination).toHaveBeenCalledWith(pagination);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('falls back to the public NPC list when the auth fetch rejects', async function() {
    const setNpcs = jasmine.createSpy('setNpcs');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
    const publicNpcs = [{ id: 1 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };

    client.currentHash.and.returnValue('#/games/demo/npcs');
    client.fetchIndex.and.returnValue(Promise.resolve({ data: publicNpcs, pagination }));
    characterClient.fetchNpcsAll.and.returnValue(Promise.reject(new Error('network error')));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
    AuthStorage.setToken('mytoken');

    const cleanup = new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, client, characterClient, undefined, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
    expect(setPagination).toHaveBeenCalledWith(pagination);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
