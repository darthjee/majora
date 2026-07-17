import CharacterController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterController', function() {
  describe('#updateCharacterMoney', function() {
    it('delegates to characterClient.updateCharacterMoney with the character kind', function() {
      const characterClient = jasmine.createSpyObj('characterClient', ['updateCharacterMoney']);
      const response = Promise.resolve({ ok: true });
      characterClient.updateCharacterMoney.and.returnValue(response);
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, characterClient, 'pcs',
      );

      const result = controller.updateCharacterMoney('demo', '2', 'tok', 500);

      expect(characterClient.updateCharacterMoney).toHaveBeenCalledWith('pcs', 'demo', '2', 'tok', 500);
      expect(result).toBe(response);
    });

    it('uses the npcs character kind when the controller is built for NPCs', function() {
      const characterClient = jasmine.createSpyObj('characterClient', ['updateCharacterMoney']);
      characterClient.updateCharacterMoney.and.returnValue(Promise.resolve({ ok: true }));
      const controller = new CharacterController(
        Noop.noop, Noop.noop, Noop.noop, null, undefined, characterClient, 'npcs',
      );

      controller.updateCharacterMoney('demo', '3', 'tok', 200);

      expect(characterClient.updateCharacterMoney).toHaveBeenCalledWith('npcs', 'demo', '3', 'tok', 200);
    });
  });
});
