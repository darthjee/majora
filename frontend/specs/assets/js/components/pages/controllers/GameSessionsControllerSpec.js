import GameSessionsController, { getGameSlugFromSessionsHash }
  from '../../../../../../assets/js/components/pages/controllers/GameSessionsController.js';

describe('GameSessionsController', function() {
  it('extracts game slug from sessions hash', function() {
    expect(getGameSlugFromSessionsHash('#/games/demo/sessions')).toBe('demo');
  });

  it('returns empty string when hash does not match sessions route', function() {
    expect(getGameSlugFromSessionsHash('#/games/demo')).toBe('');
  });

  it('uses route params to request game sessions', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, title: 'Session 1', date: '2024-01-01', game_slug: 'demo' }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/sessions.json');
    expect(setSessions).toHaveBeenCalledWith(
      [{ id: 1, title: 'Session 1', date: '2024-01-01', game_slug: 'demo' }],
    );
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when fetch fails', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load sessions.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets error without fetching when slug is missing', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games');

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(gameClient.fetchGameAccess).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load sessions.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not update state after unmount', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setSessions).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setCanEdit).not.toHaveBeenCalled();
  });

  it('sets canEdit to true when the game access response allows editing', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('sets canEdit to false when the access response is not ok', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets canEdit to false when the access request throws', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
    const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
      gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(false);

    cleanup();
  });
});
