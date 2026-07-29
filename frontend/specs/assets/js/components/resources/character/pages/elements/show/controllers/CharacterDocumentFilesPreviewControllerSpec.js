import CharacterDocumentFilesPreviewController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/show/controllers/CharacterDocumentFilesPreviewController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('CharacterDocumentFilesPreviewController', function() {
  let setFiles;
  let setLoading;
  let ensureSpy;

  beforeEach(function() {
    setFiles = jasmine.createSpy('setFiles');
    setLoading = jasmine.createSpy('setLoading');
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#buildEffect', function() {
    it('fetches the character document file shortlist through RequestStore.ensure', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{
          id: 1, character_document_id: 9, name: 'Notes', path: '/files/1/download', photo_path: null,
        }],
        pagination: { page: 1, pages: 1, perPage: 17 },
      }));

      const cleanup = new CharacterDocumentFilesPreviewController(setFiles, setLoading)
        .buildEffect('demo', 'pcs', 7, 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterDocumentFilesPreviewController',
        resource: 'characterDocumentFile',
        quantityType: 'collection',
        params: {
          gameSlug: 'demo', kind: 'pcs', characterId: 7, documentId: 9,
        },
        query: { per_page: 17 },
      });
      expect(setFiles).toHaveBeenCalledWith([{
        id: 1, character_document_id: 9, name: 'Notes', path: '/files/1/download', photo_path: null,
      }]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new CharacterDocumentFilesPreviewController(setFiles, setLoading)
        .buildEffect('demo', 'pcs', 7, 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFiles).toHaveBeenCalledWith([]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null, pagination: {} }));

      const cleanup = new CharacterDocumentFilesPreviewController(setFiles, setLoading)
        .buildEffect('demo', 'pcs', 7, 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFiles).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{
          id: 1, character_document_id: 9, name: 'Notes', path: '/files/1/download', photo_path: null,
        }],
        pagination: { page: 1, pages: 1, perPage: 17 },
      }));

      const cleanup = new CharacterDocumentFilesPreviewController(setFiles, setLoading)
        .buildEffect('demo', 'pcs', 7, 9)();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFiles).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
