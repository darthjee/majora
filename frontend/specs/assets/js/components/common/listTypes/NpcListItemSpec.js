import NpcListItem from '../../../../../../assets/js/components/common/listTypes/NpcListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/listTypes/BaseListItem.js';

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
    it('uses the profile_photo_path field', function() {
      const item = new NpcListItem({ id: 1, name: 'Goblin', profile_photo_path: '/photos/1.png' });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when profile_photo_path is absent', function() {
      const item = new NpcListItem({ id: 1, name: 'Goblin' });

      expect(item.photoUrl).toBeNull();
    });
  });
});
