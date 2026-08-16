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

  describe('gameDocumentPage mutations (issue #1129)', function() {
    it('resolves POST.collection (page create) regular/private paths and permissions', function() {
      const collection = resourceConfig.get('POST', 'gameDocumentPage', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9/pages.json');
      expect(collection.regular.permission).toBe('can_edit');
      expect(collection.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/pages/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });

    it('resolves PATCH.single (per-page update) regular/private paths and permissions', function() {
      const single = resourceConfig.get('PATCH', 'gameDocumentPage', 'single');

      expect(single.regular.path({ gameSlug: 'demo', id: '9', pageId: '3' }))
        .toBe('/games/demo/documents/9/pages/3.json');
      expect(single.regular.permission).toBe('can_edit');
      expect(single.private.path({ gameSlug: 'demo', id: '9', pageId: '3' }))
        .toBe('/games/demo/documents/9/pages/3/all.json');
      expect(single.private.permission).toBe('can_edit');
    });

    it('resolves PATCH.bumpVersion (batch version bump) regular/private paths and permissions', function() {
      const bumpVersion = resourceConfig.get('PATCH', 'gameDocumentPage', 'bumpVersion');

      expect(bumpVersion.regular.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/pages/bump_version.json');
      expect(bumpVersion.regular.permission).toBe('can_edit');
      expect(bumpVersion.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/pages/bump_version/all.json');
      expect(bumpVersion.private.permission).toBe('can_edit');
    });

    it('resolves DELETE.collection (bulk trim) regular/private paths and permissions', function() {
      const collection = resourceConfig.get('DELETE', 'gameDocumentPage', 'collection');

      expect(collection.regular.path({ gameSlug: 'demo', id: '9' })).toBe('/games/demo/documents/9/pages.json');
      expect(collection.regular.permission).toBe('can_edit');
      expect(collection.private.path({ gameSlug: 'demo', id: '9' }))
        .toBe('/games/demo/documents/9/pages/all.json');
      expect(collection.private.permission).toBe('can_edit');
    });
  });
});
