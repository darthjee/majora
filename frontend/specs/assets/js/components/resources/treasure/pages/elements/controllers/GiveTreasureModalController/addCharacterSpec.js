import GiveTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';

describe('GiveTreasureModalController', function() {
  describe('#addCharacter', function() {
    const character = { id: 3, name: 'Aria' };

    it('fetches the summary and adds a new row when the character is not yet listed', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(2));
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, [], setReceiving);

      expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 3);
      expect(setReceiving).toHaveBeenCalledWith([{
        character, kind: 'pcs', ownedQuantity: 2, pendingQuantity: 1, result: null, partialNotice: '',
      }]);
    });

    it('increments the pending quantity instead of duplicating an already-listed character', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchSummary');
      const existing = [{
        character, kind: 'pcs', ownedQuantity: 2, pendingQuantity: 1, result: null, partialNotice: '',
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving);

      expect(controller.fetchSummary).not.toHaveBeenCalled();
      expect(setReceiving).toHaveBeenCalledWith([{
        character, kind: 'pcs', ownedQuantity: 2, pendingQuantity: 2, result: null, partialNotice: '',
      }]);
    });

    it('treats a pc and an npc sharing the same id as distinct rows', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      const existing = [{
        character, kind: 'npcs', ownedQuantity: 0, pendingQuantity: 1, result: null, partialNotice: '',
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving);

      expect(setReceiving).toHaveBeenCalledWith([
        existing[0],
        {
          character, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 1, result: null, partialNotice: '',
        },
      ]);
    });

    it('refuses to increment an already-listed character once the pool cap is reached', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchSummary');
      const existing = [{
        character, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 5, result: null, partialNotice: '',
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving, 5);

      expect(setReceiving).toHaveBeenCalledWith(existing);
    });
  });
});
