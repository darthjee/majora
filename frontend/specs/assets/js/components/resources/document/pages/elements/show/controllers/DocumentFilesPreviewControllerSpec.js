import DocumentFilesPreviewController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/show/controllers/DocumentFilesPreviewController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('DocumentFilesPreviewController', function() {
  let setFiles;
  let setLoading;
  let ensureSpy;

  beforeEach(function() {
    setFiles = jasmine.createSpy('setFiles');
    setLoading = jasmine.createSpy('setLoading');
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#buildEffect', function() {
    it('fetches the document file shortlist through RequestStore.ensure', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Notes', path: '/files/1/download', photo_path: null }],
        pagination: { page: 1, pages: 1, perPage: 11 },
      }));

      const cleanup = new DocumentFilesPreviewController(setFiles, setLoading).buildEffect('demo', 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'DocumentFilesPreviewController',
        resource: 'gameDocumentFile',
        quantityType: 'collection',
        params: { gameSlug: 'demo', id: 9 },
        query: { per_page: 11 },
      });
      expect(setFiles).toHaveBeenCalledWith([{ id: 1, name: 'Notes', path: '/files/1/download', photo_path: null }]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new DocumentFilesPreviewController(setFiles, setLoading).buildEffect('demo', 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFiles).toHaveBeenCalledWith([]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null, pagination: {} }));

      const cleanup = new DocumentFilesPreviewController(setFiles, setLoading).buildEffect('demo', 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFiles).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Notes', path: '/files/1/download', photo_path: null }],
        pagination: { page: 1, pages: 1, perPage: 11 },
      }));

      const cleanup = new DocumentFilesPreviewController(setFiles, setLoading).buildEffect('demo', 9)();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setFiles).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
