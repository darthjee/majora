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
