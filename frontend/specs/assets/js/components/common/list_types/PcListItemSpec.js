import PcListItem from '../../../../../../assets/js/components/common/list_types/PcListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

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
    it('inherits the photo_path field from BaseListItem', function() {
      const item = new PcListItem({ id: 1, name: 'Aragorn', photo_path: '/photos/1.png' });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when photo_path is absent', function() {
      const item = new PcListItem({ id: 1, name: 'Aragorn' });

      expect(item.photoUrl).toBeNull();
    });
  });
});
