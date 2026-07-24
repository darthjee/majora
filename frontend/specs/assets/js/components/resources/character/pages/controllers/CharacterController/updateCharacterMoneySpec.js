import CharacterController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterController.js';
import RequestStore
  from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterController', function() {
  describe('#updateCharacterMoney', function() {
    it('delegates to RequestStore.mutate with the pc resource, PUT, and the money body', function() {
      const response = Promise.resolve({ ok: true });
      spyOn(RequestStore, 'mutate').and.returnValue(response);
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, null, 'pcs',
      );

      const result = controller.updateCharacterMoney('demo', '2', 'tok', 500);

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'pc',
        method: 'PUT',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '2' },
        body: { money: 500 },
      });
      expect(result).toBe(response);
    });

    it('uses the npc resource when the controller is built for NPCs', function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true }));
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, null, 'npcs',
      );

      controller.updateCharacterMoney('demo', '3', 'tok', 200);

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'CharacterController',
        resource: 'npc',
        method: 'PUT',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '3' },
        body: { money: 200 },
      });
    });
  });
});
