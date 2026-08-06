import GiveTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';

describe('GiveTreasureModalController', function() {
  const rowA = {
    character: { id: 1, name: 'Aria' }, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 2, result: null, partialNotice: '',
  };
  const rowB = {
    character: { id: 1, name: 'Grak' }, kind: 'npcs', ownedQuantity: 0, pendingQuantity: 1, result: null, partialNotice: '',
  };

  describe('.totalPending', function() {
    it('sums the pending quantity across every row', function() {
      expect(GiveTreasureModalController.totalPending([rowA, rowB])).toBe(3);
    });

    it('returns 0 for an empty list', function() {
      expect(GiveTreasureModalController.totalPending([])).toBe(0);
    });
  });

  describe('.incrementPending', function() {
    it('increments the pending quantity of the matching row', function() {
      const result = GiveTreasureModalController.incrementPending([rowA, rowB], 'pcs', 1);

      expect(result[0].pendingQuantity).toBe(3);
      expect(result[1]).toBe(rowB);
    });

    it('increments freely when availableUnits is null (unlimited)', function() {
      const result = GiveTreasureModalController.incrementPending([rowA, rowB], 'pcs', 1, null);

      expect(result[0].pendingQuantity).toBe(3);
    });

    it('refuses to increment once the running total across every row equals availableUnits', function() {
      const receiving = [rowA, rowB];
      const result = GiveTreasureModalController.incrementPending(receiving, 'pcs', 1, 3);

      expect(result).toBe(receiving);
      expect(result[0].pendingQuantity).toBe(2);
      expect(result[1].pendingQuantity).toBe(1);
    });

    it('still allows incrementing when the running total is below availableUnits', function() {
      const result = GiveTreasureModalController.incrementPending([rowA, rowB], 'pcs', 1, 4);

      expect(result[0].pendingQuantity).toBe(3);
    });
  });

  describe('.decrementPending', function() {
    it('decrements the pending quantity of the matching row', function() {
      const result = GiveTreasureModalController.decrementPending([rowA, rowB], 'pcs', 1);

      expect(result[0].pendingQuantity).toBe(1);
    });

    it('floors at 1', function() {
      const result = GiveTreasureModalController.decrementPending([rowB], 'npcs', 1);

      expect(result[0].pendingQuantity).toBe(1);
    });
  });

  describe('.removeCharacter', function() {
    it('removes the matching row only', function() {
      const result = GiveTreasureModalController.removeCharacter([rowA, rowB], 'pcs', 1);

      expect(result).toEqual([rowB]);
    });

    it('returns an empty array when removing the last row', function() {
      const result = GiveTreasureModalController.removeCharacter([rowB], 'npcs', 1);

      expect(result).toEqual([]);
    });
  });
});
