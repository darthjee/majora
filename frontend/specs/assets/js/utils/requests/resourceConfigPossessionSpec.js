import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (possession, issue #1074)', function() {
  describe('possession', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'possession', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/possessions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/possessions/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'possession', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves PATCH.single regular/private paths and permissions', function() {
      const single = resourceConfig.get('PATCH', 'possession', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9.json');
      expect(single.regular.permission).toBe('can_edit');
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves POST.collection (create) with matching regular/private paths and permissions', function() {
      const collection = resourceConfig.get('POST', 'possession', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/possessions.json');
      expect(collection.regular.permission).toBe('can_edit');
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/possessions.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves POST.single (photo upload init) with matching regular/private paths and permissions', function() {
      const single = resourceConfig.get('POST', 'possession', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9/photo_upload.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9/photo_upload.json');
      expect(single.private.permission).toBeNull();
    });
  });
});
