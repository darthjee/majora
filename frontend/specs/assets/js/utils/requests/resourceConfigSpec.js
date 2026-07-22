import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig', function() {
  describe('game', function() {
    it('has no separate private endpoint for collection or single', function() {
      const collection = resourceConfig.get('GET', 'game', 'collection');
      const single = resourceConfig.get('GET', 'game', 'single');

      expect(collection.regular).toBe(collection.private);
      expect(single.regular).toBe(single.private);
      expect(collection.regular.path()).toBe('/games.json');
      expect(collection.regular.permission).toBeNull();
      expect(single.regular.path({ gameSlug: 'demo' })).toBe('/games/demo.json');
      expect(single.regular.permission).toBeNull();
    });
  });

  describe('npc', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'npc', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/npcs.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/npcs/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'npc', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/npcs/3.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/npcs/3/full.json');
      expect(single.private.permission).toBe('can_edit');
    });
  });

  describe('pc', function() {
    it('has no separate private collection endpoint', function() {
      const collection = resourceConfig.get('GET', 'pc', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/pcs.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'pc', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/pcs/3.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/pcs/3/full.json');
      expect(single.private.permission).toBe('can_edit');
    });
  });

  describe('item', function() {
    it('resolves collection regular/private paths and permissions for either kind', function() {
      const collection = resourceConfig.get('GET', 'item', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/items.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/items/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions', function() {
      const single = resourceConfig.get('GET', 'item', 'single');

      expect(single.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3', itemId: '9' }))
        .toBe('/games/demo/pcs/3/items/9.json');
      expect(single.private.path({ gameSlug: 'demo', kind: 'pcs', id: '3', itemId: '9' }))
        .toBe('/games/demo/pcs/3/items/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });
  });

  describe('treasure', function() {
    it('resolves the same regular collection path for both kinds', function() {
      const collection = resourceConfig.get('GET', 'treasure', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures.json');
      expect(collection.regular.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/treasures.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('only exposes a restricted collection endpoint for npcs', function() {
      const collection = resourceConfig.get('GET', 'treasure', 'collection');

      expect(collection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/treasures/all.json');
      expect(collection.private.permission({ gameSlug: 'demo', kind: 'npcs', id: '3' })).toBe('can_edit');
    });

    it('falls back to the regular configuration for pcs', function() {
      const collection = resourceConfig.get('GET', 'treasure', 'collection');

      expect(collection.private.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures.json');
      expect(collection.private.permission({ gameSlug: 'demo', kind: 'pcs', id: '3' })).toBeNull();
    });

    it('has no single configuration', function() {
      expect(resourceConfig.get('GET', 'treasure', 'single')).toBeNull();
    });
  });

  it('returns null for an unknown resource/method/quantity-type combination', function() {
    expect(resourceConfig.get('GET', 'unknown', 'collection')).toBeNull();
    expect(resourceConfig.get('POST', 'game', 'collection')).toBeNull();
    expect(resourceConfig.get('GET', 'game', 'unknown')).toBeNull();
  });
});
