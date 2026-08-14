import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (faction, issue #812)', function() {
  describe('faction', function() {
    it('resolves collection regular/private paths and permissions for the game-level family', function() {
      const collection = resourceConfig.get('GET', 'faction', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo' })).toBe('/games/demo/factions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo' })).toBe('/games/demo/factions.json');
      expect(collection.private.permission({ gameSlug: 'demo' })).toBeNull();
    });

    it('resolves collection regular/private paths and permissions for the character-owned family '
      + '(issue #943)', function() {
      const collection = resourceConfig.get('GET', 'faction', 'collection');
      const params = {
        gameSlug: 'demo', kind: 'pcs', id: '7',
      };

      expect(collection.regular.path(params)).toBe('/games/demo/pcs/7/factions.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path(params)).toBe('/games/demo/pcs/7/factions/all.json');
      expect(collection.private.permission(params)).toBe('can_edit');
    });

    it('resolves availableCollection regular/private paths and permissions (issue #943)', function() {
      const availableCollection = resourceConfig.get('GET', 'faction', 'availableCollection');
      const params = {
        gameSlug: 'demo', kind: 'npcs', id: '7',
      };

      expect(availableCollection.regular.path(params)).toBe('/games/demo/npcs/7/factions/available.json');
      expect(availableCollection.regular.permission).toBeNull();
      expect(availableCollection.private.path(params)).toBe('/games/demo/npcs/7/factions/available/all.json');
      expect(availableCollection.private.permission).toBe('can_edit');
    });

    it('resolves characters regular/private paths and permissions (issue #943)', function() {
      const characters = resourceConfig.get('GET', 'faction', 'characters');
      const params = { gameSlug: 'demo', id: '9' };

      expect(characters.regular.path(params)).toBe('/games/demo/factions/9/characters.json');
      expect(characters.regular.permission).toBeNull();
      expect(characters.regular.skipCache).toBeUndefined();
      expect(characters.private.path(params)).toBe('/games/demo/factions/9/characters/all.json');
      expect(characters.private.permission).toBe('can_edit');
      expect(characters.private.skipCache).toBe(true);
    });

    it('resolves summary regular/private paths and permissions (issue #943)', function() {
      const summary = resourceConfig.get('GET', 'faction', 'summary');
      const params = {
        gameSlug: 'demo', factionId: '9', kind: 'pcs', id: '7',
      };

      expect(summary.regular.path(params)).toBe('/games/demo/factions/9/pcs/7/summary.json');
      expect(summary.regular.permission).toBeNull();
      expect(summary.regular.skipCache).toBe(true);
      expect(summary.private.path(params)).toBe('/games/demo/factions/9/pcs/7/summary/all.json');
      expect(summary.private.permission).toBe('can_edit');
      expect(summary.private.skipCache).toBe(true);
    });

    it('resolves POST.acquire regular/private paths and permissions (issue #943)', function() {
      const acquire = resourceConfig.get('POST', 'faction', 'acquire');
      const params = {
        gameSlug: 'demo', kind: 'pcs', id: '7',
      };

      expect(acquire.regular.path(params)).toBe('/games/demo/pcs/7/factions/acquire.json');
      expect(acquire.regular.permission).toBeNull();
      expect(acquire.private.path(params)).toBe('/games/demo/pcs/7/factions/acquire/all.json');
      expect(acquire.private.permission).toBe('can_edit');
    });

    it('resolves POST.remove regular/private paths and permissions (issue #943)', function() {
      const remove = resourceConfig.get('POST', 'faction', 'remove');
      const params = {
        gameSlug: 'demo', kind: 'npcs', id: '7',
      };

      expect(remove.regular.path(params)).toBe('/games/demo/npcs/7/factions/remove.json');
      expect(remove.regular.permission).toBeNull();
      expect(remove.private.path(params)).toBe('/games/demo/npcs/7/factions/remove/all.json');
      expect(remove.private.permission).toBe('can_edit');
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
