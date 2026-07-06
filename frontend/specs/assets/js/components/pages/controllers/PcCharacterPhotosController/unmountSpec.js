import PcCharacterPhotosController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterPhotosController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildCharacterClient } from './support.js';

describe('PcCharacterPhotosController', function() {
  let characterClient;

  beforeEach(function() {
    AuthStorage.clearToken();
    characterClient = buildCharacterClient();
  });

  it('does not update state after unmount', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/pcs/7/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 20 },
    }));

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setPhotos).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setCharacter).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });
});
