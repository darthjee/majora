import CharacterController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterController.js';
import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterController', function() {
  describe('#setProfilePhoto', function() {
    it('delegates to RequestStore.mutate with the pc resource, PATCH, and the photo params', function() {
      const response = Promise.resolve({ ok: true });
      spyOn(RequestStore, 'mutate').and.returnValue(response);
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, null, 'pcs',
      );

      const result = controller.setProfilePhoto('demo', '2', '9');

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'pc',
        method: 'PATCH',
        quantityType: 'photo',
        params: { gameSlug: 'demo', id: '2', photoId: '9' },
        body: { roles: ['profile'] },
      });
      expect(result).toBe(response);
    });

    it('uses the npc resource when the controller is built for NPCs', function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true }));
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, null, 'npcs',
      );

      controller.setProfilePhoto('demo', '3', '7');

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'npc',
        method: 'PATCH',
        quantityType: 'photo',
        params: { gameSlug: 'demo', id: '3', photoId: '7' },
        body: { roles: ['profile'] },
      });
    });

    it('propagates a rejection from RequestStore.mutate', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network error')));
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, null, 'pcs',
      );

      await expectAsync(controller.setProfilePhoto('demo', '2', '9')).toBeRejected();
    });
  });
});
