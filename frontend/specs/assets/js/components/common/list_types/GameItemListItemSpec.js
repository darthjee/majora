import GameItemListItem from '../../../../../../assets/js/components/common/list_types/GameItemListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('GameItemListItem', function() {
  it('extends BaseListItem', function() {
    const item = new GameItemListItem({ id: 1, name: 'Cloak of Elvenkind' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new GameItemListItem({
      id: 1, name: 'Cloak of Elvenkind', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Cloak of Elvenkind');
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new GameItemListItem({ id: 1, name: 'Cloak of Elvenkind', hidden: true });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new GameItemListItem({ id: 1, name: 'Cloak of Elvenkind' });

      expect(item.hidden).toBe(false);
    });
  });
});
