import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

/**
 * Covers the `POST`/`PATCH` mutation entries `treasureConfig.js`/`itemConfig.js`/
 * `documentConfig.js` gained in issue #841 — split out of `resourceConfigSpec.js` to keep that
 * file under the project's 300-line limit (it already covers every resource's `GET` config, plus
 * #830's PC/NPC mutation entries).
 */
describe('resourceConfig mutations (issue #841)', function() {
  describe('item', function() {
    it('resolves PATCH.single as a single un-branched, can_edit-gated variant, for a character-owned item', function() {
      const single = resourceConfig.get('PATCH', 'item', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3', itemId: '9' }))
        .toBe('/games/demo/pcs/3/items/9.json');
      expect(single.regular.permission).toBe('can_edit');
    });

    it('resolves PATCH.single for a game-owned item', function() {
      const single = resourceConfig.get('PATCH', 'item', 'single');

      expect(single.regular.path({ gameSlug: 'demo', kind: 'game', id: '9' })).toBe('/games/demo/items/9.json');
    });

    it('resolves POST.collection as a single un-branched, can_edit-gated variant, for a character-owned item', function() {
      const collection = resourceConfig.get('POST', 'item', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/items.json');
      expect(collection.regular.permission).toBe('can_edit');
    });

    it('resolves POST.collection for a game-owned item', function() {
      const collection = resourceConfig.get('POST', 'item', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/items.json');
    });

    it('resolves POST.single (photo upload init) onto the CharacterItem override path for a character-owned item', function() {
      const single = resourceConfig.get('POST', 'item', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({
        gameSlug: 'demo', kind: 'pcs', id: '3', itemId: '9',
      })).toBe('/games/demo/pcs/3/items/9/photo_upload.json');
      expect(single.regular.permission).toBeNull();
    });

    it('resolves POST.single (photo upload init) onto the GameItem itself for a game-owned item', function() {
      const single = resourceConfig.get('POST', 'item', 'single');

      expect(single.regular.path({ gameSlug: 'demo', kind: 'game', id: '9' }))
        .toBe('/games/demo/items/9/photo_upload.json');
    });
  });

  describe('treasure', function() {
    it('resolves POST.collection onto the game catalog when gameSlug is given', function() {
      const collection = resourceConfig.get('POST', 'treasure', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/treasures.json');
      expect(collection.regular.permission).toBe('can_edit');
    });

    it('resolves POST.collection onto the standalone route when no gameSlug is given', function() {
      const collection = resourceConfig.get('POST', 'treasure', 'collection');

      expect(collection.regular.path()).toBe('/treasures.json');
      expect(collection.regular.path({})).toBe('/treasures.json');
    });

    it('resolves PATCH.single as a single un-branched variant, reusing the GET single path', function() {
      const single = resourceConfig.get('PATCH', 'treasure', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ id: '42' })).toBe('/treasures/42.json');
      expect(single.regular.path({ gameSlug: 'demo', id: '42' })).toBe('/games/demo/treasures/42.json');
      expect(single.regular.permission).toBeNull();
    });

    it('resolves POST.single (photo upload init) onto the standalone-only route', function() {
      const single = resourceConfig.get('POST', 'treasure', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ id: '42' })).toBe('/treasures/42/photo_upload.json');
      expect(single.regular.permission).toBeNull();
    });
  });

  describe('document', function() {
    it('resolves POST.gameCollection as a single un-branched, can_edit-gated variant', function() {
      const gameCollection = resourceConfig.get('POST', 'document', 'gameCollection');

      expect(gameCollection.regular).toBe(gameCollection.private);
      expect(gameCollection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/documents.json');
      expect(gameCollection.regular.permission).toBe('can_edit');
    });
  });
});

/**
 * Covers the `POST`/`PATCH` mutation entries `gameConfig.js`/`itemConfig.js`/`treasureConfig.js`
 * gained in issue #844 (exchange-modal tabs, game create/edit, game photo upload).
 */
describe('resourceConfig mutations (issue #844)', function() {
  describe('game', function() {
    it('resolves POST.collection (game creation) as a single un-branched variant', function() {
      const collection = resourceConfig.get('POST', 'game', 'collection');

      expect(collection.regular).toBe(collection.private);
      expect(collection.regular.path()).toBe('/games.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('resolves POST.single (photo upload init) as a single un-branched variant', function() {
      const single = resourceConfig.get('POST', 'game', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/photo_upload.json');
      expect(single.regular.permission).toBeNull();
    });

    it('resolves PATCH.single (game update) as a single un-branched variant', function() {
      const single = resourceConfig.get('PATCH', 'game', 'single');

      expect(single.regular).toBe(single.private);
      expect(single.regular.path({ gameSlug: 'demo' })).toBe('/games/demo.json');
      expect(single.regular.permission).toBeNull();
    });
  });

  describe('item', function() {
    it('resolves POST.acquire regular/private paths and permissions', function() {
      const acquire = resourceConfig.get('POST', 'item', 'acquire');

      expect(acquire.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/items/acquire.json');
      expect(acquire.regular.permission).toBeNull();
      expect(acquire.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/items/acquire/all.json');
      expect(acquire.private.permission).toBe('can_edit');
    });

    it('resolves POST.remove regular/private paths and permissions', function() {
      const remove = resourceConfig.get('POST', 'item', 'remove');

      expect(remove.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/items/remove.json');
      expect(remove.regular.permission).toBeNull();
      expect(remove.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/items/remove/all.json');
      expect(remove.private.permission).toBe('can_edit');
    });
  });

  describe('treasure', function() {
    it('resolves POST.acquire regular/private paths and permissions', function() {
      const acquire = resourceConfig.get('POST', 'treasure', 'acquire');

      expect(acquire.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures/acquire.json');
      expect(acquire.regular.permission).toBeNull();
      expect(acquire.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/treasures/acquire/all.json');
      expect(acquire.private.permission).toBe('can_edit');
    });

    it('resolves POST.buy regular/private paths and permissions', function() {
      const buy = resourceConfig.get('POST', 'treasure', 'buy');

      expect(buy.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures/buy.json');
      expect(buy.regular.permission).toBeNull();
      expect(buy.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/treasures/buy/all.json');
      expect(buy.private.permission).toBe('can_edit');
    });

    it('resolves POST.remove as a single un-branched variant, with no DM/admin-only endpoint', function() {
      const remove = resourceConfig.get('POST', 'treasure', 'remove');

      expect(remove.regular).toBe(remove.private);
      expect(remove.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures/remove.json');
      expect(remove.regular.permission).toBeNull();
    });

    it('resolves POST.sell as a single un-branched variant, with no DM/admin-only endpoint', function() {
      const sell = resourceConfig.get('POST', 'treasure', 'sell');

      expect(sell.regular).toBe(sell.private);
      expect(sell.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/treasures/sell.json');
      expect(sell.regular.permission).toBeNull();
    });
  });
});
