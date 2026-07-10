import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    let characterClient;

    beforeEach(function() {
      AuthStorage.clearToken();
      characterClient = buildCharacterClient();
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: false }));
    });

    it('sets error when fetch fails', async function() {
      const setPhotos = jasmine.createSpy('setPhotos');
      const setPagination = jasmine.createSpy('setPagination');
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7/photos`);
      client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new Controller(
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

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7`);

      const cleanup = new Controller(
        setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load photos.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });
  });
});
