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
    it('resolves collection regular/private paths and permissions for either character-owned kind', function() {
      const collection = resourceConfig.get('GET', 'item', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/items.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/items/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves collection regular/private paths and permissions for the game-owned kind', function() {
      const collection = resourceConfig.get('GET', 'item', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/items.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/items/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions for a character-owned item', function() {
      const single = resourceConfig.get('GET', 'item', 'single');

      expect(single.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3', itemId: '9' }))
        .toBe('/games/demo/pcs/3/items/9.json');
      expect(single.private.path({ gameSlug: 'demo', kind: 'pcs', id: '3', itemId: '9' }))
        .toBe('/games/demo/pcs/3/items/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions for a game-owned item', function() {
      const single = resourceConfig.get('GET', 'item', 'single');

      expect(single.regular.path({ gameSlug: 'demo', kind: 'game', id: '9' }))
        .toBe('/games/demo/items/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', kind: 'game', id: '9' }))
        .toBe('/games/demo/items/9/full.json');
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

    it('resolves collection regular/private paths and permissions for the game-catalog kind', function() {
      const collection = resourceConfig.get('GET', 'treasure', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/treasures.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/treasures/all.json');
      expect(collection.private.permission({ gameSlug: 'demo', kind: 'game' })).toBe('can_edit');
    });

    it('has no separate private endpoint for single', function() {
      const single = resourceConfig.get('GET', 'treasure', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ id: '42' })).toBe('/treasures/42.json');
      expect(single.regular.permission).toBeNull();
    });

    it('resolves the game-scoped single path when gameSlug is given', function() {
      const single = resourceConfig.get('GET', 'treasure', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '42' })).toBe('/games/demo/treasures/42.json');
      expect(single.private.path({ gameSlug: 'demo', id: '42' })).toBe('/games/demo/treasures/42.json');
    });

    it('never elevates ownedCollection to the hidden-inclusive all.json path, for either kind', function() {
      const ownedCollection = resourceConfig.get('GET', 'treasure', 'ownedCollection');

      expect(ownedCollection.regular).toBe(ownedCollection.private);
      expect(ownedCollection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures.json');
      expect(ownedCollection.regular.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/treasures.json');
      expect(ownedCollection.regular.permission).toBeNull();
      expect(ownedCollection.private.permission).toBeNull();
    });
  });

  describe('session', function() {
    it('has no separate private endpoint for single, and no collection entry', function() {
      const single = resourceConfig.get('GET', 'session', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo', id: '3' })).toBe('/games/demo/sessions/3.json');
      expect(single.regular.permission).toBeNull();
      expect(resourceConfig.get('GET', 'session', 'collection')).toBeNull();
    });
  });

  describe('document', function() {
    it('resolves collection regular/private paths and permissions for either kind', function() {
      const collection = resourceConfig.get('GET', 'document', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/documents.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/documents/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions for a game document (issue #758)', function() {
      const single = resourceConfig.get('GET', 'document', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });
  });

  it('returns null for an unknown resource/method/quantity-type combination', function() {
    expect(resourceConfig.get('GET', 'unknown', 'collection')).toBeNull();
    expect(resourceConfig.get('POST', 'game', 'collection')).toBeNull();
    expect(resourceConfig.get('GET', 'game', 'unknown')).toBeNull();
  });
});
