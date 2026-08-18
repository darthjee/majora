import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (commonItem, issue #826)', function() {
  describe('commonItem', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'commonItem', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/common_items.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/common_items/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'commonItem', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/common_items/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/common_items/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves PATCH.single regular/private paths and permissions, unbranched', function() {
      const single = resourceConfig.get('PATCH', 'commonItem', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/common_items/9.json');
      expect(single.regular.permission).toBe('can_edit');
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/common_items/9.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves POST.collection (create)', function() {
      const collection = resourceConfig.get('POST', 'commonItem', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/common_items.json');
      expect(collection.regular.permission).toBe('can_edit');
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/common_items.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves POST.single (photo upload init), unbranched', function() {
      const single = resourceConfig.get('POST', 'commonItem', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/common_items/9/photo_upload.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/common_items/9/photo_upload.json');
      expect(single.private.permission).toBeNull();
    });
  });
});
