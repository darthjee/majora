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

      expect(characterClient.setPhotoRoles).toHaveBeenCalledWith('pcs', 'demo', '7', '9', null, ['profile']);
      expect(characterClient.fetchCharacter).toHaveBeenCalledWith('pcs', 'demo', '7', null);
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

      characterClient.setPhotoRoles.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new PcCharacterPhotosController(
        setPhotos, setPagination, setCharacter, setLoading, setError, client, characterClient,
      );

      await expectAsync(controller.setProfilePhoto('demo', '7', '9')).toBeResolved();

      expect(setCharacter).not.toHaveBeenCalled();
    });
  });
});
