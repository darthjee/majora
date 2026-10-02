import StaffPhotosController from '../../../../../../../../../assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import {
  buildSetters, stubAccessStore, flush, PAGINATION,
} from './support.js';

describe('StaffPhotosController', function() {
  let setters;
  let ensureSpy;
  let originalWindow;

  /**
   * @description Routes the index and collection ensure calls to the given results.
   * @param {Promise} indexResult - Index response.
   * @param {Promise} [listResult] - Collection response.
   * @returns {void}
   */
  function stubEnsure(indexResult, listResult) {
    ensureSpy.and.callFake(({ quantityType }) => (quantityType === 'index' ? indexResult : listResult));
  }

  beforeEach(function() {
    setters = buildSetters();
    ensureSpy = spyOn(RequestStore, 'ensure');
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#buildEffect', function() {
    it('loads the types index then the first type list when no type is requested', async function() {
      stubAccessStore(true);
      globalThis.window = { location: { hash: '#/staff/photos' } };
      stubEnsure(
        Promise.resolve({ data: { max_dimension: 1024, types: ['game', 'character'] } }),
        Promise.resolve({ data: [{ id: 1 }], pagination: PAGINATION }),
      );

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffPhotosController', resource: 'staffPhoto', quantityType: 'index',
      });
      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffPhotosController',
        resource: 'staffPhoto',
        quantityType: 'collection',
        params: { photoType: 'game' },
        query: {},
      });
      expect(setters.setTypes).toHaveBeenCalledWith(['game', 'character']);
      expect(setters.setMaxDimension).toHaveBeenCalledWith(1024);
      expect(setters.setPhotoType).toHaveBeenCalledWith('game');
      expect(setters.setPhotos).toHaveBeenCalledWith([{ id: 1 }]);
      expect(setters.setPagination).toHaveBeenCalledWith(PAGINATION);
      expect(setters.setLoading).toHaveBeenCalledWith(false);
      expect(setters.setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('uses the requested hash type and only pagination params as the query', async function() {
      stubAccessStore(true);
      globalThis.window = { location: { hash: '#/staff/photos?type=character&page=2&per_page=5' } };
      stubEnsure(
        Promise.resolve({ data: { max_dimension: 1024, types: ['game', 'character'] } }),
        Promise.resolve({ data: [], pagination: PAGINATION }),
      );

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        quantityType: 'collection',
        params: { photoType: 'character' },
        query: { page: '2', per_page: '5' },
      }));
      expect(setters.setPhotoType).toHaveBeenCalledWith('character');

      cleanup();
    });

    it('falls back to the first type when the requested type is unknown', async function() {
      stubAccessStore(true);
      globalThis.window = { location: { hash: '#/staff/photos?type=mystery' } };
      stubEnsure(
        Promise.resolve({ data: { max_dimension: 1024, types: ['game'] } }),
        Promise.resolve({ data: [], pagination: PAGINATION }),
      );

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(setters.setPhotoType).toHaveBeenCalledWith('game');

      cleanup();
    });

    it('stops loading without fetching a list when there are no types', async function() {
      stubAccessStore(true);
      stubEnsure(Promise.resolve({ data: {} }));

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(ensureSpy).toHaveBeenCalledTimes(1);
      expect(setters.setTypes).toHaveBeenCalledWith([]);
      expect(setters.setMaxDimension).toHaveBeenCalledWith(null);
      expect(setters.setPhotoType).toHaveBeenCalledWith(null);
      expect(setters.setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('stores a null-body index as no types', async function() {
      stubAccessStore(true);
      stubEnsure(Promise.resolve({ data: null }));

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(setters.setTypes).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('sets the load error when the index fetch fails', async function() {
      stubAccessStore(true);
      stubEnsure(Promise.reject(new Error('boom')));

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(setters.setError).toHaveBeenCalledWith('staff_photos_page.error');
      expect(setters.setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('redirects to home and does not fetch when the user is not staff', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();

      expect(fakeWindow.location.hash).toBe('/');
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('ignores the access result after unmount', async function() {
      stubAccessStore(true);

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      cleanup();
      await flush();

      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it('ignores results landing after unmount', async function() {
      stubAccessStore(true);
      let resolveIndex;
      stubEnsure(new Promise((resolve) => { resolveIndex = resolve; }));

      const cleanup = new StaffPhotosController(setters).buildEffect()();
      await flush();
      cleanup();
      resolveIndex({ data: { types: ['game'] } });
      await flush();

      expect(setters.setTypes).not.toHaveBeenCalled();
    });
  });
});
