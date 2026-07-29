import DocumentPhotosPreviewController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/show/controllers/DocumentPhotosPreviewController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('DocumentPhotosPreviewController', function() {
  let setPhotos;
  let setLoading;
  let ensureSpy;

  beforeEach(function() {
    setPhotos = jasmine.createSpy('setPhotos');
    setLoading = jasmine.createSpy('setLoading');
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#buildEffect', function() {
    it('fetches the document photo shortlist through RequestStore.ensure', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, path: '/photos/1.jpg' }],
        pagination: { page: 1, pages: 1, perPage: 17 },
      }));

      const cleanup = new DocumentPhotosPreviewController(setPhotos, setLoading).buildEffect('demo', 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'DocumentPhotosPreviewController',
        resource: 'gameDocumentPhoto',
        quantityType: 'collection',
        params: { gameSlug: 'demo', id: 9 },
        query: { per_page: 17 },
      });
      expect(setPhotos).toHaveBeenCalledWith([{ id: 1, path: '/photos/1.jpg' }]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new DocumentPhotosPreviewController(setPhotos, setLoading).buildEffect('demo', 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).toHaveBeenCalledWith([]);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the response data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null, pagination: {} }));

      const cleanup = new DocumentPhotosPreviewController(setPhotos, setLoading).buildEffect('demo', 9)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, path: '/photos/1.jpg' }],
        pagination: { page: 1, pages: 1, perPage: 17 },
      }));

      const cleanup = new DocumentPhotosPreviewController(setPhotos, setLoading).buildEffect('demo', 9)();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
