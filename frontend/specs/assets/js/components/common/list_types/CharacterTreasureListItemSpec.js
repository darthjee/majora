import CharacterTreasureListItem from '../../../../../../assets/js/components/common/list_types/CharacterTreasureListItem.js';
import TreasureListItem from '../../../../../../assets/js/components/common/list_types/TreasureListItem.js';

describe('CharacterTreasureListItem', function() {
  it('extends TreasureListItem', function() {
    const item = new CharacterTreasureListItem({
      id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500,
    });

    expect(item instanceof TreasureListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new CharacterTreasureListItem({
      id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500, photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Golden Crown');
  });

  describe('#quantity', function() {
    it('reads the owned quantity from the raw entry', function() {
      const item = new CharacterTreasureListItem({
        id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 3, value: 500,
      });

      expect(item.quantity).toBe(3);
    });
  });

  describe('#formattedValue', function() {
    it('delegates to TreasureMoneyHelper using the merged game_type', function() {
      const item = new CharacterTreasureListItem({
        id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500, game_type: 'dnd',
      });

      expect(item.formattedValue).toBe('5 GP');
    });
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden (npc-treasures/all.json only)', function() {
      const item = new CharacterTreasureListItem({
        id: 1, treasure_id: 11, name: 'Golden Crown', quantity: 1, value: 500, hidden: true,
      });

      expect(item.hidden).toBe(true);
    });
  });
});
