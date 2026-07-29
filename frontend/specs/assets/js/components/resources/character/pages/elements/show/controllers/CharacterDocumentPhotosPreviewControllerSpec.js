import CharacterDocumentPhotosPreviewController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/show/controllers/CharacterDocumentPhotosPreviewController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('CharacterDocumentPhotosPreviewController', function() {
  let setPhotos;
  let setLoading;
  let ensureSpy;

  beforeEach(function() {
    setPhotos = jasmine.createSpy('setPhotos');
    setLoading = jasmine.createSpy('setLoading');
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#buildEffect', function() {
    it('fetches the character document photo shortlist through RequestStore.ensure', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, character_document_id: 9, path: '/photos/1.jpg' }],
        pagination: { page: 1, pages: 1, perPage: 17 },
      }));

      const cleanup = new CharacterDocumentPhotosPreviewController(setPhotos, setLoading)
        .buildEffect('demo', 'npcs', 7, 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterDocumentPhotosPreviewController',
        resource: 'characterDocumentPhoto',
        quantityType: 'collection',
        params: {
          gameSlug: 'demo', kind: 'npcs', characterId: 7, documentId: 9,
        },
        query: { per_page: 17 },
      });
      expect(setPhotos).toHaveBeenCalledWith([{ id: 1, character_document_id: 9, path: '/photos/1.jpg' }]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new CharacterDocumentPhotosPreviewController(setPhotos, setLoading)
        .buildEffect('demo', 'npcs', 7, 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).toHaveBeenCalledWith([]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null, pagination: {} }));

      const cleanup = new CharacterDocumentPhotosPreviewController(setPhotos, setLoading)
        .buildEffect('demo', 'npcs', 7, 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, character_document_id: 9, path: '/photos/1.jpg' }],
        pagination: { page: 1, pages: 1, perPage: 17 },
      }));

      const cleanup = new CharacterDocumentPhotosPreviewController(setPhotos, setLoading)
        .buildEffect('demo', 'npcs', 7, 9)();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
