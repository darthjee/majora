import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (gameDocumentPhoto/gameDocumentFile, issue #873)', function() {
  describe('gameDocumentPhoto', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'gameDocumentPhoto', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9/photos.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/photos/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });
  });

  describe('gameDocumentFile', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'gameDocumentFile', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9/files.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/files/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });
  });
});

describe('resourceConfig (gameDocumentPage, issue #1126)', function() {
  describe('gameDocumentPage', function() {
    it('resolves collection regular/private paths and permissions', function() {
      const collection = resourceConfig.get('GET', 'gameDocumentPage', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9/pages.json');
      expect(collection.regular.permission).toBeNull();
      expect(collection.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/pages/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });
  });
});
