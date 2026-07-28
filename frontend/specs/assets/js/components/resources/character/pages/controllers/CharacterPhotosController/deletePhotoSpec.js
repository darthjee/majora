import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    let characterClient;
    let photoDeleteSaga;

    beforeEach(function() {
      AuthStorage.clearToken();
      characterClient = buildCharacterClient();
      photoDeleteSaga = jasmine.createSpyObj('photoDeleteSaga', ['run']);
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: false }));
    });

    describe('#deletePhoto', function() {
      it('runs the delete saga for the given photo and refreshes photos and the character', async function() {
        photoDeleteSaga.run.and.returnValue(Promise.resolve(true));
        const setPhotos = jasmine.createSpy('setPhotos');
        const setPagination = jasmine.createSpy('setPagination');
        const setCharacter = jasmine.createSpy('setCharacter');
        const setLoading = jasmine.createSpy('setLoading');
        const setError = jasmine.createSpy('setError');
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
        client.fetchIndex.and.returnValue(Promise.resolve({ data: [], pagination: { page: 1, pages: 1, perPage: 10 } }));

        const controller = new Controller(
          setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient, photoDeleteSaga,
        );

        await controller.deletePhoto('demo', '7', '9');

        expect(photoDeleteSaga.run).toHaveBeenCalledWith(kind === 'pcs' ? 'pc' : 'npc', 'demo', '7', '9');
        expect(client.fetchIndex).toHaveBeenCalledWith(`/games/demo/${kind}/7/photos.json`);
        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '7', null);
        expect(setCharacter).toHaveBeenCalledWith(
          jasmine.objectContaining({ name: 'Aragorn', can_edit: false }),
        );
      });

      it('rejects and leaves state untouched when the delete saga reports failure', async function() {
        photoDeleteSaga.run.and.returnValue(Promise.resolve(false));
        const setPhotos = jasmine.createSpy('setPhotos');
        const setPagination = jasmine.createSpy('setPagination');
        const setCharacter = jasmine.createSpy('setCharacter');
        const setLoading = jasmine.createSpy('setLoading');
        const setError = jasmine.createSpy('setError');
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

        const controller = new Controller(
          setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient, photoDeleteSaga,
        );

        await expectAsync(controller.deletePhoto('demo', '7', '9')).toBeRejected();

        expect(client.fetchIndex).not.toHaveBeenCalled();
        expect(setCharacter).not.toHaveBeenCalled();
      });

      it('builds its own PhotoDeleteSaga when none is injected', function() {
        const controller = new Controller(
          jasmine.createSpy('setPhotos'),
          jasmine.createSpy('setPagination'),
          jasmine.createSpy('setCharacter'),
          jasmine.createSpy('setLoading'),
          jasmine.createSpy('setError'),
        );

        expect(controller.photoDeleteSaga).toBeTruthy();
      });
    });
  });
});
