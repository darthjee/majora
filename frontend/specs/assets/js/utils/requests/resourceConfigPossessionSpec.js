import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (possession, issues #1074/#1076)', function() {
  describe('possession', function() {
    it('resolves collection regular/private paths and permissions for the game-owned kind', function() {
      const collection = resourceConfig.get('GET', 'possession', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/possessions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/possessions/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves collection regular/private paths and permissions for either character-owned kind', function() {
      const collection = resourceConfig.get('GET', 'possession', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/possessions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/possessions/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions for a game-owned possession', function() {
      const single = resourceConfig.get('GET', 'possession', 'single');

      expect(single.regular.path({ gameSlug: 'demo', kind: 'game', id: '9' })).toBe('/games/demo/possessions/9.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', kind: 'game', id: '9' }))
        .toBe('/games/demo/possessions/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves single regular/private paths and permissions for a character-owned possession', function() {
      const single = resourceConfig.get('GET', 'possession', 'single');

      expect(single.regular.path({
        gameSlug: 'demo', kind: 'pcs', id: '3', possessionId: '9',
      })).toBe('/games/demo/pcs/3/possessions/9.json');
      expect(single.private.path({
        gameSlug: 'demo', kind: 'pcs', id: '3', possessionId: '9',
      })).toBe('/games/demo/pcs/3/possessions/9/full.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves PATCH.single regular/private paths and permissions, unbranched on kind', function() {
      const single = resourceConfig.get('PATCH', 'possession', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9.json');
      expect(single.regular.permission).toBe('can_edit');
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves POST.collection (create) for the game-owned kind', function() {
      const collection = resourceConfig.get('POST', 'possession', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/possessions.json');
      expect(collection.regular.permission).toBe('can_edit');
      expect(collection.private.path({ gameSlug: 'demo', kind: 'game' })).toBe('/games/demo/possessions.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves POST.collection (create-from-scratch) for a character-owned kind (issue #1076)', function() {
      const collection = resourceConfig.get('POST', 'possession', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/possessions.json');
      expect(collection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/possessions.json');
    });

    it('resolves POST.single (photo upload init), unbranched on kind', function() {
      const single = resourceConfig.get('POST', 'possession', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9/photo_upload.json');
      expect(single.regular.permission).toBeNull();
      expect(single.private.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/possessions/9/photo_upload.json');
      expect(single.private.permission).toBeNull();
    });

    it('resolves availableCollection regular/private paths and permissions (issue #1076)', function() {
      const availableCollection = resourceConfig.get('GET', 'possession', 'availableCollection');

      expect(availableCollection.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/possessions/available.json');
      expect(availableCollection.regular.permission).toBeNull();
      expect(availableCollection.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/possessions/available/all.json');
      expect(availableCollection.private.permission).toBe('can_edit');
    });

    it('resolves POST.acquire regular/private paths (issue #1076)', function() {
      const acquire = resourceConfig.get('POST', 'possession', 'acquire');

      expect(acquire.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/possessions/acquire.json');
      expect(acquire.regular.permission).toBeNull();
      expect(acquire.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/possessions/acquire/all.json');
      expect(acquire.private.permission).toBe('can_edit');
    });

    it('resolves POST.remove regular/private paths (issue #1076)', function() {
      const remove = resourceConfig.get('POST', 'possession', 'remove');

      expect(remove.regular.path({ gameSlug: 'demo', kind: 'pcs', id: '3' }))
        .toBe('/games/demo/pcs/3/possessions/remove.json');
      expect(remove.regular.permission).toBeNull();
      expect(remove.private.path({ gameSlug: 'demo', kind: 'npcs', id: '3' }))
        .toBe('/games/demo/npcs/3/possessions/remove/all.json');
      expect(remove.private.permission).toBe('can_edit');
    });
  });
});
