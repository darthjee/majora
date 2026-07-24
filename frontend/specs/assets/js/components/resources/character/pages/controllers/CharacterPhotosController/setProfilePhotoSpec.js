import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    let characterClient;

    beforeEach(function() {
      AuthStorage.clearToken();
      characterClient = buildCharacterClient();
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: false }));
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true }));
    });

    describe('#setProfilePhoto', function() {
      it('sends the profile role for the given photo and refreshes the character', async function() {
        const setPhotos = jasmine.createSpy('setPhotos');
        const setPagination = jasmine.createSpy('setPagination');
        const setCharacter = jasmine.createSpy('setCharacter');
        const setLoading = jasmine.createSpy('setLoading');
        const setError = jasmine.createSpy('setError');
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

        const controller = new Controller(
          setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
        );

        await controller.setProfilePhoto('demo', '7', '9');

        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: 'BaseCharacterPhotosController',
          resource: kind === 'pcs' ? 'pc' : 'npc',
          method: 'PATCH',
          quantityType: 'photo',
          params: { gameSlug: 'demo', id: '7', photoId: '9' },
          body: { roles: ['profile'] },
        });
        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '7', null);
        expect(setCharacter).toHaveBeenCalledWith(
          jasmine.objectContaining({ name: 'Aragorn', can_edit: false }),
        );
      });

      it('rejects and leaves state untouched when the request fails', async function() {
        const setPhotos = jasmine.createSpy('setPhotos');
        const setPagination = jasmine.createSpy('setPagination');
        const setCharacter = jasmine.createSpy('setCharacter');
        const setLoading = jasmine.createSpy('setLoading');
        const setError = jasmine.createSpy('setError');
        const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

        RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

        const controller = new Controller(
          setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
        );

        await expectAsync(controller.setProfilePhoto('demo', '7', '9')).toBeRejected();

        expect(setCharacter).not.toHaveBeenCalled();
      });
    });
  });
});
