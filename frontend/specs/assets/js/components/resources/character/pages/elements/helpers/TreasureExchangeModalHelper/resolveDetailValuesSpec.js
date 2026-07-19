import { resolveDetailValues }
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';

describe('resolveDetailValues', function() {
  describe('when the active tab is acquire', function() {
    it('resolves the owned count from ownedByTreasureId, defaulting to 0', function() {
      const selected = { id: 9, treasure_id: 9, quantity: 3 };

      expect(resolveDetailValues({ activeTab: 'acquire', selected, ownedByTreasureId: { 9: 2 } }))
        .toEqual({ treasureId: 9, owned: 2, maxQuantity: undefined });

      expect(resolveDetailValues({ activeTab: 'acquire', selected, ownedByTreasureId: {} }))
        .toEqual({ treasureId: 9, owned: 0, maxQuantity: undefined });
    });
  });

  describe('when the active tab is sell', function() {
    it('resolves the owned count and max quantity from the selected item', function() {
      const selected = { id: 9, treasure_id: 9, quantity: 3 };

      expect(resolveDetailValues({ activeTab: 'sell', selected, ownedByTreasureId: {} }))
        .toEqual({ treasureId: 9, owned: 3, maxQuantity: 3 });
    });
  });
});
