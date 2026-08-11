import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

/**
 * Covers the `collection` resource's `GET`/`POST` config entries introduced in issue #1057 —
 * split into its own file (rather than added to `resourceConfigSpec.js`) to keep every
 * resource-config spec file under the project's 300-line limit, mirroring the precedent
 * `resourceConfigGameDocumentSpec.js`/`resourceConfigCharacterDocumentSpec.js`/
 * `resourceConfigMutations842Spec.js` already established.
 */
describe('resourceConfig collection (issue #1057)', function() {
  describe('collection', function() {
    it('has no separate private endpoint for collection or single', function() {
      const collection = resourceConfig.get('GET', 'collection', 'collection');
      const single = resourceConfig.get('GET', 'collection', 'single');

      expect(collection.regular).toBe(collection.private);
      expect(single.regular).toBe(single.private);
      expect(collection.regular.path()).toBe('/miniatures/collections.json');
      expect(collection.regular.permission).toBeNull();
      expect(single.regular.path({ id: '42' })).toBe('/miniatures/collections/42.json');
      expect(single.regular.permission).toBeNull();
    });

    it('has no separate private endpoint for create or photo-upload init', function() {
      const create = resourceConfig.get('POST', 'collection', 'collection');
      const photoUploadInit = resourceConfig.get('POST', 'collection', 'single');

      expect(create.regular).toBe(create.private);
      expect(photoUploadInit.regular).toBe(photoUploadInit.private);
      expect(create.regular.path()).toBe('/miniatures/collections.json');
      expect(create.regular.permission).toBeNull();
      expect(photoUploadInit.regular.path({ id: '42' })).toBe('/miniatures/collections/42/photo_upload.json');
      expect(photoUploadInit.regular.permission).toBeNull();
    });
  });
});
