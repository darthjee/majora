import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig', function() {
  describe('characterPhoto (issue #1616)', function() {
    const collection = resourceConfig.get('GET', 'characterPhoto', 'collection');
    const pc = { gameSlug: 'demo', kind: 'pcs', id: '3' };
    const npc = { gameSlug: 'demo', kind: 'npcs', id: '3' };

    it('resolves the plain photos.json path for both kinds', function() {
      expect(collection.regular.path(pc)).toBe('/games/demo/pcs/3/photos.json');
      expect(collection.regular.path(npc)).toBe('/games/demo/npcs/3/photos.json');
      expect(collection.regular.permission).toBeNull();
    });

    it('resolves the restricted photos/all.json path for npcs, gated by can_edit', function() {
      expect(collection.private.path(npc)).toBe('/games/demo/npcs/3/photos/all.json');
      expect(collection.private.permission(npc)).toBe('can_edit');
      expect(collection.private.skipCache).toBe(true);
    });

    it('keeps pcs on the plain path with no permission', function() {
      expect(collection.private.path(pc)).toBe('/games/demo/pcs/3/photos.json');
      expect(collection.private.permission(pc)).toBeNull();
    });
  });
});
