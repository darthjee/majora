import CharacterController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterController', function() {
  describe('#setProfilePhoto', function() {
    it('delegates to characterClient.setPhotoRoles with the character kind and auth token', function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      const characterClient = jasmine.createSpyObj('characterClient', ['setPhotoRoles']);
      const response = Promise.resolve({ ok: true });
      characterClient.setPhotoRoles.and.returnValue(response);
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, characterClient, 'pcs',
      );

      const result = controller.setProfilePhoto('demo', '2', '9');

      expect(characterClient.setPhotoRoles).toHaveBeenCalledWith('pcs', 'demo', '2', '9', 'auth-tok', ['profile']);
      expect(result).toBe(response);
    });

    it('uses the npcs character kind when the controller is built for NPCs', function() {
      spyOn(AuthStorage, 'getToken').and.returnValue(null);
      const characterClient = jasmine.createSpyObj('characterClient', ['setPhotoRoles']);
      characterClient.setPhotoRoles.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, characterClient, 'npcs',
      );

      controller.setProfilePhoto('demo', '3', '7');

      expect(characterClient.setPhotoRoles).toHaveBeenCalledWith('npcs', 'demo', '3', '7', null, ['profile']);
    });

    it('propagates a rejection from the client', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('auth-tok');
      const characterClient = jasmine.createSpyObj('characterClient', ['setPhotoRoles']);
      characterClient.setPhotoRoles.and.returnValue(Promise.reject(new Error('network error')));
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, characterClient, 'pcs',
      );

      await expectAsync(controller.setProfilePhoto('demo', '2', '9')).toBeRejected();
    });
  });
});
