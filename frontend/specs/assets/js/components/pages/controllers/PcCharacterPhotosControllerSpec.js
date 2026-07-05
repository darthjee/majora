import PcCharacterPhotosController, { getPcCharacterPhotosParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterPhotosController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterPhotosController', function() {
  let characterClient;

  beforeEach(function() {
    AuthStorage.clearToken();
    characterClient = jasmine.createSpyObj(
      'characterClient', ['fetchPc', 'fetchPcAccess', 'setPcPhotoRoles'],
    );
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ name: 'Aragorn' }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));
    characterClient.setPcPhotoRoles.and.returnValue(Promise.resolve({ ok: true }));
  });

  it('extracts game slug and character id from the pc photos hash', function() {
    expect(getPcCharacterPhotosParamsFromHash('#/games/demo/pcs/7/photos'))
      .toEqual({ game_slug: 'demo', character_id: '7' });
  });

  it('returns empty strings when hash does not match the pc photos route', function() {
    expect(getPcCharacterPhotosParamsFromHash('#/games/demo/pcs/7'))
      .toEqual({ game_slug: '', character_id: '' });
  });

  it('uses route params to request character photos', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/pcs/7/photos');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, path: 'photos/pcs/7/a.jpg' }],
      pagination: { page: 1, pages: 1, perPage: 20 },
    }));

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/pcs/7/photos.json');
    expect(setPhotos).toHaveBeenCalledWith([{ id: 1, path: 'photos/pcs/7/a.jpg' }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 20 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('merges can_edit from the access endpoint onto the character object', async function() {
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
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Aragorn', can_edit: true }),
    );

    cleanup();
  });

  it('sets can_edit to false when the character fetch fails', async function() {
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
    characterClient.fetchPc.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ can_edit: false });

    cleanup();
  });

  it('sets can_edit to false when the character response is not ok', async function() {
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
    characterClient.fetchPc.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ can_edit: false });

    cleanup();
  });

  it('sets can_edit to false when the access fetch fails after loading the character', async function() {
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
    characterClient.fetchPcAccess.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Aragorn', can_edit: false }),
    );

    cleanup();
  });

  it('sets error when fetch fails', async function() {
    const setPhotos = jasmine.createSpy('setPhotos');
    const setPagination = jasmine.createSpy('setPagination');
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/pcs/7/photos');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new PcCharacterPhotosController(
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

    client.currentHash.and.returnValue('#/games/demo/pcs/7');

    const cleanup = new PcCharacterPhotosController(
      setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load photos.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  describe('#setProfilePhoto', function() {
    it('sends the profile role for the given photo and refreshes the character', async function() {
      const setPhotos = jasmine.createSpy('setPhotos');
      const setPagination = jasmine.createSpy('setPagination');
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      const controller = new PcCharacterPhotosController(
        setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
      );

      await controller.setProfilePhoto('demo', '7', '9');

      expect(characterClient.setPcPhotoRoles).toHaveBeenCalledWith('demo', '7', '9', null, ['profile']);
      expect(characterClient.fetchPc).toHaveBeenCalledWith('demo', '7', null);
      expect(setCharacter).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Aragorn', can_edit: false }),
      );
    });

    it('does not throw and leaves state untouched when the request fails', async function() {
      const setPhotos = jasmine.createSpy('setPhotos');
      const setPagination = jasmine.createSpy('setPagination');
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      characterClient.setPcPhotoRoles.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new PcCharacterPhotosController(
        setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
      );

      await expectAsync(controller.setProfilePhoto('demo', '7', '9')).toBeResolved();

      expect(setCharacter).not.toHaveBeenCalled();
    });
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
