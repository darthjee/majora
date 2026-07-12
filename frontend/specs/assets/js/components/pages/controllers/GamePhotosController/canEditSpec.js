import GamePhotosController
  from '../../../../../../../assets/js/components/pages/controllers/GamePhotosController.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';
import { buildGameClient, stubAccessStore } from './support.js';

describe('GamePhotosController', function() {
  let gameClient;

  beforeEach(function() {
    gameClient = buildGameClient();
    stubAccessStore();
  });

  it('merges can_edit from AccessStore onto the game object', async function() {
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
    AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: true }));

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

  it('sets can_edit to false when the access resolves with the fail-closed default after loading the game',
    async function() {
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
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setGame).toHaveBeenCalledWith(
        jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
      );

      cleanup();
    });
});
