import GamePhotosController, { getGameSlugFromPhotosHash }
  from '../../../../../../assets/js/components/pages/controllers/GamePhotosController.js';

describe('GamePhotosController', function() {
  let gameClient;

  beforeEach(function() {
    gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
    gameClient.fetchGame.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
  });

  it('extracts game slug from photos hash', function() {
    expect(getGameSlugFromPhotosHash('#/games/demo/photos')).toBe('demo');
  });

  it('returns empty string when hash does not match photos route', function() {
    expect(getGameSlugFromPhotosHash('#/games/demo')).toBe('');
  });

  it('uses route params to request game photos', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, path: 'photos/games/demo/a.jpg' }],
      pagination: { page: 1, pages: 2, perPage: 20 },
    }));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/photos.json');
    expect(setPhotos).toHaveBeenCalledWith([{ id: 1, path: 'photos/games/demo/a.jpg' }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 2, perPage: 20 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('merges can_edit from the access endpoint onto the game object', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 20 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: true }),
    );

    cleanup();
  });

  it('sets can_edit to false when the game fetch fails', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 20 },
    }));
    gameClient.fetchGame.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith({ can_edit: false });

    cleanup();
  });

  it('sets can_edit to false when the game response is not ok', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 20 },
    }));
    gameClient.fetchGame.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith({ can_edit: false });

    cleanup();
  });

  it('sets can_edit to false when the access fetch fails after loading the game', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 20 },
    }));
    gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
    );

    cleanup();
  });

  it('sets error when fetch fails', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load photos.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets error without fetching when slug is missing', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games');

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load photos.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not update state after unmount', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 20 },
    }));

    const cleanup = new GamePhotosController(
      setPhotos, setPagination, setGame, setLoading, setError, client, gameClient,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setPhotos).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setGame).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });
});
