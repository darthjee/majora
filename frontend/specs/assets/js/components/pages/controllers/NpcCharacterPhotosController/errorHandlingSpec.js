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

  it('sets error when fetch fails', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs/7/photos');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new NpcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load photos.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets error without fetching when params are missing', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs/7');

    const cleanup = new NpcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load photos.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
});
