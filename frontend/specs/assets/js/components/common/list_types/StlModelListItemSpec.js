import StlModelListItem from '../../../../../../assets/js/components/common/list_types/StlModelListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';
import { buildStlModel } from '../../../../../support/factories.js';

describe('StlModelListItem', function() {
  it('extends BaseListItem', function() {
    const item = new StlModelListItem(buildStlModel());

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits displayText from BaseListItem', function() {
    const item = new StlModelListItem(buildStlModel({ name: 'Goblin Miniature' }));

    expect(item.displayText).toBe('Goblin Miniature');
  });

  describe('#photoUrl', function() {
    it('returns the raw entry photo_url when present', function() {
      const item = new StlModelListItem(buildStlModel({ photo_url: '/photos/1.png' }));

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('returns null when the raw entry has no photo_url', function() {
      const item = new StlModelListItem(buildStlModel({ photo_url: null }));

      expect(item.photoUrl).toBeNull();
    });
  });
});
