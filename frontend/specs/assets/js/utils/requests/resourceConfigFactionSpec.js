import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (faction, issue #812)', function() {
  describe('faction', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'faction', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/factions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/factions.json');
      expect(collection.private.permission).toBeNull();
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'faction', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/factions/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/factions/9.json');
      expect(single.private.permission).toBeNull();
    });

    it('resolves PATCH.single regular/private paths and permissions', function() {
      const single = resourceConfig.get('PATCH', 'faction', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/factions/9.json');
      expect(single.regular.permission).toBe('can_edit');
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/factions/9.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves POST.collection (create) with matching regular/private paths and permissions', function() {
      const collection = resourceConfig.get('POST', 'faction', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/factions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/factions.json');
      expect(collection.private.permission).toBeNull();
    });

    it('resolves POST.single (photo upload init) with matching regular/private paths and permissions', function() {
      const single = resourceConfig.get('POST', 'faction', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/factions/9/photo_upload.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/factions/9/photo_upload.json');
      expect(single.private.permission).toBeNull();
    });
  });
});
