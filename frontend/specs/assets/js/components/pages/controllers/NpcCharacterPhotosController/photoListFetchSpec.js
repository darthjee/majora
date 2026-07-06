import NpcCharacterPhotosController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterPhotosController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildCharacterClient } from './support.js';

describe('NpcCharacterPhotosController', function() {
  let characterClient;

  beforeEach(function() {
    AuthStorage.clearToken();
    characterClient = buildCharacterClient();
  });

  it('uses route params to request character photos', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs/7/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, path: 'photos/npcs/7/a.jpg' }],
      pagination: { page: 1, pages: 1, perPage: 20 },
    }));

    const cleanup = new NpcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/npcs/7/photos.json');
    expect(setPhotos).toHaveBeenCalledWith([{ id: 1, path: 'photos/npcs/7/a.jpg' }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 20 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
