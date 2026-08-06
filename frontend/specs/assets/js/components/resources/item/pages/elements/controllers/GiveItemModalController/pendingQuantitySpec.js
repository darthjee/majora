import GiveItemModalController
  from '../../../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';

describe('GiveItemModalController', function() {
  const rowA = {
    character: { id: 1, name: 'Aria' }, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 2, result: null,
  };
  const rowB = {
    character: { id: 1, name: 'Grak' }, kind: 'npcs', ownedQuantity: 0, pendingQuantity: 1, result: null,
  };

  describe('.incrementPending', function() {
    it('increments the pending quantity of the matching row', function() {
      const result = GiveItemModalController.incrementPending([rowA, rowB], 'pcs', 1);

      expect(result[0].pendingQuantity).toBe(3);
      expect(result[1]).toBe(rowB);
    });
  });

  describe('.decrementPending', function() {
    it('decrements the pending quantity of the matching row', function() {
      const result = GiveItemModalController.decrementPending([rowA, rowB], 'pcs', 1);

      expect(result[0].pendingQuantity).toBe(1);
    });

    it('floors at 1', function() {
      const result = GiveItemModalController.decrementPending([rowB], 'npcs', 1);

      expect(result[0].pendingQuantity).toBe(1);
    });
  });

  describe('.removeCharacter', function() {
    it('removes the matching row only', function() {
      const result = GiveItemModalController.removeCharacter([rowA, rowB], 'pcs', 1);

      expect(result).toEqual([rowB]);
    });

    it('returns an empty array when removing the last row', function() {
      const result = GiveItemModalController.removeCharacter([rowB], 'npcs', 1);

      expect(result).toEqual([]);
    });
  });
});
