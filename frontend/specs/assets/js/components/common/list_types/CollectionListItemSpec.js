import CollectionListItem from '../../../../../../assets/js/components/common/list_types/CollectionListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';
import { buildCollection } from '../../../../../support/factories.js';

describe('CollectionListItem', function() {
  it('extends BaseListItem', function() {
    const item = new CollectionListItem(buildCollection());

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits displayText from BaseListItem', function() {
    const item = new CollectionListItem(buildCollection({ name: 'Goblin Pack' }));

    expect(item.displayText).toBe('Goblin Pack');
  });

  describe('#photoUrl', function() {
    it('returns the raw entry photo_url when present', function() {
      const item = new CollectionListItem(buildCollection({ photo_url: '/photos/1.png' }));

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('returns null when the raw entry has no photo_url', function() {
      const item = new CollectionListItem(buildCollection({ photo_url: null }));

      expect(item.photoUrl).toBeNull();
    });
  });

  describe('#formattedValue', function() {
    it('renders the stl_model_count as a caption', function() {
      const item = new CollectionListItem(buildCollection({ stl_model_count: 3 }));

      expect(item.formattedValue).toBe('3 STL Models');
    });

    it('defaults to 0 when stl_model_count is missing', function() {
      const item = new CollectionListItem(buildCollection({ stl_model_count: undefined }));

      expect(item.formattedValue).toBe('0 STL Models');
    });
  });
});
