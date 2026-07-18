import TreasureListItem from '../../../../../../assets/js/components/common/list_types/TreasureListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';
import TreasureMoneyHelper from '../../../../../../assets/js/components/common/misc/helpers/TreasureMoneyHelper.jsx';

describe('TreasureListItem', function() {
  it('extends BaseListItem', function() {
    const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new TreasureListItem({
      id: 1, name: 'Golden Crown', value: 500, photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Golden Crown');
  });

  describe('#formattedValue', function() {
    it('delegates to TreasureMoneyHelper for the dnd denomination breakdown', function() {
      const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });

      expect(item.formattedValue).toBe(TreasureMoneyHelper.render(500, undefined));
      expect(item.formattedValue).toBe('5 GP');
    });

    it('delegates to TreasureMoneyHelper for deadlands "$ dollars,cents"', function() {
      const item = new TreasureListItem({
        id: 1, name: 'Golden Crown', value: 350, game_type: 'deadlands',
      });

      expect(item.formattedValue).toBe('$ 3,50');
    });
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new TreasureListItem({
        id: 1, name: 'Golden Crown', value: 500, hidden: true,
      });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });

      expect(item.hidden).toBe(false);
    });
  });

  describe('#availabilityText', function() {
    it('is null when max_units is absent', function() {
      const item = new TreasureListItem({ id: 1, name: 'Golden Crown', value: 500 });

      expect(item.availabilityText).toBeNull();
    });

    it('is null when max_units is null', function() {
      const item = new TreasureListItem({
        id: 1, name: 'Golden Crown', value: 500, available_units: null, max_units: null,
      });

      expect(item.availabilityText).toBeNull();
    });

    it('formats the available/max units when max_units is present', function() {
      const item = new TreasureListItem({
        id: 1, name: 'Golden Crown', value: 500, available_units: 3, max_units: 10,
      });

      expect(item.availabilityText).toBe('Available: 3 / 10');
    });

    it('formats the line even when available_units is 0', function() {
      const item = new TreasureListItem({
        id: 1, name: 'Golden Crown', value: 500, available_units: 0, max_units: 10,
      });

      expect(item.availabilityText).toBe('Available: 0 / 10');
    });
  });
});
