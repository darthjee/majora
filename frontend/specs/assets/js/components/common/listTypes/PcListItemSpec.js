import PcListItem from '../../../../../../assets/js/components/common/listTypes/PcListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/listTypes/BaseListItem.js';

describe('PcListItem', function() {
  it('extends BaseListItem', function() {
    const item = new PcListItem({ id: 1, name: 'Aragorn' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits displayText from BaseListItem', function() {
    const item = new PcListItem({ id: 1, name: 'Aragorn' });

    expect(item.displayText).toBe('Aragorn');
  });

  describe('#photoUrl', function() {
    it('uses the profile_photo_path field', function() {
      const item = new PcListItem({ id: 1, name: 'Aragorn', profile_photo_path: '/photos/1.png' });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when profile_photo_path is absent', function() {
      const item = new PcListItem({ id: 1, name: 'Aragorn' });

      expect(item.photoUrl).toBeNull();
    });
  });
});
