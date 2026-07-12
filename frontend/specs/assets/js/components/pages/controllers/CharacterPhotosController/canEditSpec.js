import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    let characterClient;

    beforeEach(function() {
      AuthStorage.clearToken();
      characterClient = buildCharacterClient();
    });

    it('merges can_edit from AccessStore onto the character object', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
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
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith(kind, 'demo', '7');
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

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7/photos`);
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 20 },
      }));
      characterClient.fetchCharacter.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new Controller(
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

      client.currentHash.and.returnValue(`#/games/demo/${kind}/7/photos`);
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 20 },
      }));
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new Controller(
        setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({ can_edit: false });

      cleanup();
    });

    it('sets can_edit to false when AccessStore resolves with the fail-closed default', async function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
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
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Aragorn', can_edit: false }),
      );

      cleanup();
    });
  });
});
