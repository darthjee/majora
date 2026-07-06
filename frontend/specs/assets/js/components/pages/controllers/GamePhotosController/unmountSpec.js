import GamePhotosController
  from '../../../../../../../assets/js/components/pages/controllers/GamePhotosController.js';
import { buildGameClient } from './support.js';

describe('GamePhotosController', function() {
  let gameClient;

  beforeEach(function() {
    gameClient = buildGameClient();
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
