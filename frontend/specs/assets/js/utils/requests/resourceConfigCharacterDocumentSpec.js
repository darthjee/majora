import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (characterDocumentFile/characterDocumentPhoto, issue #897)', function() {
  describe('characterDocumentFile', function() {
    it('resolves collection regular/private paths and permissions for either kind', function() {
      const collection = resourceConfig.get('GET', 'characterDocumentFile', 'collection');

      expect(collection.regular.path({
        gameSlug: 'demo', kind: 'pcs', characterId: '3', documentId: '9',
      })).toBe('/games/demo/pcs/3/documents/9/files.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({
        gameSlug: 'demo', kind: 'npcs', characterId: '3', documentId: '9',
      })).toBe('/games/demo/npcs/3/documents/9/files/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });
  });

  describe('characterDocumentPhoto', function() {
    it('resolves collection regular/private paths and permissions for either kind', function() {
      const collection = resourceConfig.get('GET', 'characterDocumentPhoto', 'collection');

      expect(collection.regular.path({
        gameSlug: 'demo', kind: 'pcs', characterId: '3', documentId: '9',
      })).toBe('/games/demo/pcs/3/documents/9/photos.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({
        gameSlug: 'demo', kind: 'npcs', characterId: '3', documentId: '9',
      })).toBe('/games/demo/npcs/3/documents/9/photos/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });
  });
});
