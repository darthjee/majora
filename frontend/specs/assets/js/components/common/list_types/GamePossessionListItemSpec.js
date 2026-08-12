import GamePossessionListItem from '../../../../../../assets/js/components/common/list_types/GamePossessionListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('GamePossessionListItem', function() {
  it('extends BaseListItem', function() {
    const item = new GamePossessionListItem({ id: 1, name: 'Old Tavern' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new GamePossessionListItem({
      id: 1, name: 'Old Tavern', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Old Tavern');
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new GamePossessionListItem({ id: 1, name: 'Old Tavern', hidden: true });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new GamePossessionListItem({ id: 1, name: 'Old Tavern' });

      expect(item.hidden).toBe(false);
    });
  });
});
