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

    it('does not update state after unmount', async function() {
      const setPhotos = jasmine.createSpy('setPhotos');
      const setPagination = jasmine.createSpy('setPagination');
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7/photos`);
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 20 },
      }));

      const cleanup = new Controller(
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
});
