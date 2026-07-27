import GameDocumentPhotosController
  from '../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentPhotosController.js';
import HashRouteResolver from '../../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameDocumentPhotosController', function() {
  describe('.getParamsFromHash', function() {
    it('extracts game_slug and id', function() {
      const params = GameDocumentPhotosController.getParamsFromHash('#/games/demo/documents/9/photos');
      expect(params).toEqual({ game_slug: 'demo', id: '9' });
    });

    it('defaults to empty strings when the hash does not match', function() {
      expect(GameDocumentPhotosController.getParamsFromHash('#/other')).toEqual({ game_slug: '', id: '' });
    });
  });

  describe('#buildEffect', function() {
    let setPhotos;
    let setPagination;
    let setLoading;
    let setError;
    let ensureSpy;

    beforeEach(function() {
      setPhotos = jasmine.createSpy('setPhotos');
      setPagination = jasmine.createSpy('setPagination');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      ensureSpy = spyOn(RequestStore, 'ensure');
    });

    it('fetches photos through RequestStore.ensure, forwarding page/per_page from the hash', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, path: '/photos/1.jpg' }],
        pagination: { page: 2, pages: 3, perPage: 5 },
      }));
      const hashResolver = new HashRouteResolver(() => '#/games/demo/documents/9/photos?page=2&per_page=5');

      const controller = new GameDocumentPhotosController(setPhotos, setPagination, setLoading, setError, hashResolver);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameDocumentPhotosController',
        resource: 'gameDocumentPhoto',
        quantityType: 'collection',
        params: { gameSlug: 'demo', id: '9' },
        query: { page: '2', per_page: '5' },
      });
      expect(setPhotos).toHaveBeenCalledWith([{ id: 1, path: '/photos/1.jpg' }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 5 });
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and stops loading when game_slug/id are missing from the hash', function() {
      const hashResolver = new HashRouteResolver(() => '#/other');

      const controller = new GameDocumentPhotosController(setPhotos, setPagination, setLoading, setError, hashResolver);
      const cleanup = controller.buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load photos.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('boom')));
      const hashResolver = new HashRouteResolver(() => '#/games/demo/documents/9/photos');

      const controller = new GameDocumentPhotosController(setPhotos, setPagination, setLoading, setError, hashResolver);
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load photos.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, path: '/photos/1.jpg' }],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const hashResolver = new HashRouteResolver(() => '#/games/demo/documents/9/photos');

      const controller = new GameDocumentPhotosController(setPhotos, setPagination, setLoading, setError, hashResolver);
      const cleanup = controller.buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setPhotos).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
