import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (recipe, issue #1449)', function() {
  describe('recipe', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'recipe', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/recipes.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/recipes/all.json');
      expect(collection.private.permission).toBe('can_edit');
      expect(collection.private.skipCache).toBeTrue();
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'recipe', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/recipes/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/recipes/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves commonItemCollection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'recipe', 'commonItemCollection');

      expect(collection.regular.path({ gameSlug: 'demo', commonItemId: '4' }))
        .toBe('/games/demo/common_items/4/recipes.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', commonItemId: '4' }))
        .toBe('/games/demo/common_items/4/recipes/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves PATCH.single regular/private paths and permissions, unbranched', function() {
      const single = resourceConfig.get('PATCH', 'recipe', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/recipes/9.json');
      expect(single.regular.permission).toBe('can_edit');
      expect(single.private).toBe(single.regular);
    });

    it('resolves POST.collection (create), unbranched', function() {
      const collection = resourceConfig.get('POST', 'recipe', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/recipes.json');
      expect(collection.regular.permission).toBe('can_edit');
      expect(collection.private).toBe(collection.regular);
    });

    it('has no characters quantity type', function() {
      expect(resourceConfig.get('GET', 'recipe', 'characters')).toBeNull();
    });
  });
});
