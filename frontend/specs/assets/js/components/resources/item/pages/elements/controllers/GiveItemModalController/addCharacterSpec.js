import GiveItemModalController
  from '../../../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';

describe('GiveItemModalController', function() {
  describe('#addCharacter', function() {
    const character = { id: 3, name: 'Aria' };

    it('fetches the summary and adds a new row when the character is not yet listed', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(2));
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, [], setReceiving);

      expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 3);
      expect(setReceiving).toHaveBeenCalledWith([{
        character, kind: 'pcs', ownedQuantity: 2, pendingQuantity: 1, result: null,
      }]);
    });

    it('increments the pending quantity instead of duplicating an already-listed character', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'fetchSummary');
      const existing = [{
        character, kind: 'pcs', ownedQuantity: 2, pendingQuantity: 1, result: null,
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving);

      expect(controller.fetchSummary).not.toHaveBeenCalled();
      expect(setReceiving).toHaveBeenCalledWith([{
        character, kind: 'pcs', ownedQuantity: 2, pendingQuantity: 2, result: null,
      }]);
    });

    it('treats a pc and an npc sharing the same id as distinct rows', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      const existing = [{
        character, kind: 'npcs', ownedQuantity: 0, pendingQuantity: 1, result: null,
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving);

      expect(setReceiving).toHaveBeenCalledWith([
        existing[0],
        {
          character, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 1, result: null,
        },
      ]);
    });
  });
});
