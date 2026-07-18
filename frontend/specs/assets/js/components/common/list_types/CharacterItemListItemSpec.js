import CharacterItemListItem from '../../../../../../assets/js/components/common/list_types/CharacterItemListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('CharacterItemListItem', function() {
  it('extends BaseListItem', function() {
    const item = new CharacterItemListItem({ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new CharacterItemListItem({
      id: 1, game_item_id: 5, name: 'Cloak of Elvenkind', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Cloak of Elvenkind');
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new CharacterItemListItem({
        id: 1, game_item_id: 5, name: 'Cloak of Elvenkind', hidden: true,
      });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new CharacterItemListItem({ id: 1, game_item_id: 5, name: 'Cloak of Elvenkind' });

      expect(item.hidden).toBe(false);
    });
  });
});
