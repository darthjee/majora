import GameCommonItemListItem from '../../../../../../assets/js/components/common/list_types/GameCommonItemListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('GameCommonItemListItem', function() {
  it('extends BaseListItem', function() {
    const item = new GameCommonItemListItem({ id: 1, name: 'Healing Potion' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new GameCommonItemListItem({
      id: 1, name: 'Healing Potion', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Healing Potion');
  });

  describe('#formattedValue', function() {
    it('renders the price via TreasureMoneyHelper', function() {
      const item = new GameCommonItemListItem({ id: 1, name: 'Healing Potion', price: 500 });

      expect(item.formattedValue).toBe('5 GP');
    });
  });

  describe('#availabilityText', function() {
    it("renders the category's translated label", function() {
      const item = new GameCommonItemListItem({ id: 1, name: 'Healing Potion', category: 'potion' });

      expect(item.availabilityText).toBe('Potion');
    });

    it('defaults to the "other" category label when category is missing', function() {
      const item = new GameCommonItemListItem({ id: 1, name: 'Healing Potion' });

      expect(item.availabilityText).toBe('Other');
    });
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new GameCommonItemListItem({ id: 1, name: 'Healing Potion', hidden: true });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new GameCommonItemListItem({ id: 1, name: 'Healing Potion' });

      expect(item.hidden).toBe(false);
    });
  });
});
