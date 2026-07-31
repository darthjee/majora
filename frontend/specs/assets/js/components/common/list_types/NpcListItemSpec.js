import NpcListItem from '../../../../../../assets/js/components/common/list_types/NpcListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('NpcListItem', function() {
  it('extends BaseListItem', function() {
    const item = new NpcListItem({ id: 1, name: 'Goblin' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits displayText from BaseListItem', function() {
    const item = new NpcListItem({ id: 1, name: 'Goblin' });

    expect(item.displayText).toBe('Goblin');
  });

  describe('#photoUrl', function() {
    it('inherits the photo_path field from BaseListItem', function() {
      const item = new NpcListItem({ id: 1, name: 'Goblin', photo_path: '/photos/1.png' });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when photo_path is absent', function() {
      const item = new NpcListItem({ id: 1, name: 'Goblin' });

      expect(item.photoUrl).toBeNull();
    });
  });
});
