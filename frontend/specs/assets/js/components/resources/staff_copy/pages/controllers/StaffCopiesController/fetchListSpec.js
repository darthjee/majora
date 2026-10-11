import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSetters, buildMountedController, PAGINATION } from './support.js';

describe('StaffCopiesController', function() {
  let setters;
  let controller;
  let ensureSpy;
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/staff/copies' } };
    setters = buildSetters();
    controller = buildMountedController(setters);
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#fetchList', function() {
    it('stores the rows and pagination of the active type', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [{ id: 3 }], pagination: PAGINATION }));

      await controller.fetchList();

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'staffCopy',
        quantityType: 'collection',
        params: { copyType: 'items' },
        query: { from: 'source-game', to: 'target-game' },
      }));
      expect(setters.setRows).toHaveBeenCalledWith([{ id: 3 }]);
      expect(setters.setPagination).toHaveBeenCalledWith(PAGINATION);
      expect(setters.setLoading).toHaveBeenCalledWith(false);
    });

    it('stores an empty list when the data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null, pagination: PAGINATION }));

      await controller.fetchList();

      expect(setters.setRows).toHaveBeenCalledWith([]);
    });

    it('sets the list error when the fetch fails', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('boom')));

      await controller.fetchList();

      expect(setters.setListError).toHaveBeenCalledWith('staff_copies_page.error');
      expect(setters.setError).not.toHaveBeenCalled();
      expect(setters.setLoading).toHaveBeenCalledWith(false);
    });

    it('ignores results when unmounted', async function() {
      controller.mounted = false;
      ensureSpy.and.returnValue(Promise.resolve({ data: [{ id: 3 }], pagination: PAGINATION }));

      await controller.fetchList();

      expect(setters.setRows).not.toHaveBeenCalled();
    });
  });
});
