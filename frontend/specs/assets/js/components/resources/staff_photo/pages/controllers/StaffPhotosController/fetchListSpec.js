import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSetters, buildMountedController, PAGINATION } from './support.js';

describe('StaffPhotosController', function() {
  let setters;
  let controller;
  let ensureSpy;

  beforeEach(function() {
    setters = buildSetters();
    controller = buildMountedController(setters);
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#fetchList', function() {
    it('stores the photos and pagination of the active type', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [{ id: 3 }], pagination: PAGINATION }));

      await controller.fetchList();

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'staffPhoto', quantityType: 'collection', params: { photoType: 'game_item' },
      }));
      expect(ensureSpy.calls.mostRecent().args[0].query.type).toBeUndefined();
      expect(setters.setPhotos).toHaveBeenCalledWith([{ id: 3 }]);
      expect(setters.setPagination).toHaveBeenCalledWith(PAGINATION);
      expect(setters.setLoading).toHaveBeenCalledWith(false);
    });

    it('stores an empty list when the data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null, pagination: PAGINATION }));

      await controller.fetchList();

      expect(setters.setPhotos).toHaveBeenCalledWith([]);
    });

    it('sets the load error when the fetch fails', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('boom')));

      await controller.fetchList();

      expect(setters.setError).toHaveBeenCalledWith('staff_photos_page.error');
      expect(setters.setLoading).toHaveBeenCalledWith(false);
    });

    it('ignores results when unmounted', async function() {
      controller.mounted = false;
      ensureSpy.and.returnValue(Promise.resolve({ data: [{ id: 3 }], pagination: PAGINATION }));

      await controller.fetchList();

      expect(setters.setPhotos).not.toHaveBeenCalled();
    });
  });
});
