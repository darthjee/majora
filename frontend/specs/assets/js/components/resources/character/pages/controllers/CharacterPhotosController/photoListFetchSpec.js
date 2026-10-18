import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    let characterClient;

    beforeEach(function() {
      AuthStorage.clearToken();
      characterClient = buildCharacterClient();
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: false }));
    });

    it('uses route params to request character photos', async function() {
      const setPhotos = jasmine.createSpy('setPhotos');
      const setPagination = jasmine.createSpy('setPagination');
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7/photos`);
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [{ id: 1, path: `photos/${kind}/7/a.jpg` }],
        pagination: { page: 1, pages: 1, perPage: 20 },
      }));

      const cleanup = new Controller(
        setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).toHaveBeenCalledWith(`/games/demo/${kind}/7/photos.json`);
      expect(setPhotos).toHaveBeenCalledWith([{ id: 1, path: `photos/${kind}/7/a.jpg` }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 20 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('reads the restricted photo and character routes for an editor (issue #1616)', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7/photos`);
      client.fetchIndex.and.returnValue(Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 20 } }));

      const setter = jasmine.createSpy('setter');
      const cleanup = new Controller(setter, setter, setter, setter, setter, client, characterClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const photosPath = kind === 'npcs' ? '/games/demo/npcs/7/photos/all.json' : '/games/demo/pcs/7/photos.json';

      expect(client.fetchIndex).toHaveBeenCalledWith(photosPath);
      expect(characterClient.fetchCharacterAt).toHaveBeenCalledWith(kind, `/games/demo/${kind}/7/full.json`, null);

      cleanup();
    });
  });
});
