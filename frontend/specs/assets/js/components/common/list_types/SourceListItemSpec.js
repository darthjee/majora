import SourceListItem from '../../../../../../assets/js/components/common/list_types/SourceListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';
import { buildSource } from '../../../../../support/factories.js';

describe('SourceListItem', function() {
  it('extends BaseListItem', function() {
    const item = new SourceListItem(buildSource());

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits displayText from BaseListItem', function() {
    const item = new SourceListItem(buildSource({ name: 'MyMiniFactory' }));

    expect(item.displayText).toBe('MyMiniFactory');
  });

  describe('#photoUrl', function() {
    it('returns the raw entry photo_url when present', function() {
      const item = new SourceListItem(buildSource({ photo_url: '/photos/1.png' }));

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('returns null when the raw entry has no photo_url', function() {
      const item = new SourceListItem(buildSource({ photo_url: null }));

      expect(item.photoUrl).toBeNull();
    });
  });
});
