import GamePhotosController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePhotosController.js';
import { buildGameClient, stubAccessStore } from './support.js';

describe('GamePhotosController', function() {
  let gameClient;

  beforeEach(function() {
    gameClient = buildGameClient();
    stubAccessStore();
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
});
