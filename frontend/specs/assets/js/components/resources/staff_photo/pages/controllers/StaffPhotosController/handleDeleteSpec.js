import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSetters, buildMountedController } from './support.js';

describe('StaffPhotosController', function() {
  let setters;
  let controller;
  let mutateSpy;

  beforeEach(function() {
    setters = buildSetters();
    controller = buildMountedController(setters);
    mutateSpy = spyOn(RequestStore, 'mutate');
    spyOn(RequestStore, 'purge');
    spyOn(controller, 'fetchList').and.returnValue(Promise.resolve());
  });

  describe('#handleDelete', function() {
    it('sends the DELETE with the regular variant and refetches on success', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, status: 204 }));

      await controller.handleDelete({ id: 9 });

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'StaffPhotosController',
        resource: 'staffPhoto',
        method: 'DELETE',
        quantityType: 'single',
        params: { photoType: 'game_item', id: 9 },
        variantName: 'regular',
      });
      expect(setters.setActionError).toHaveBeenCalledOnceWith(null);
      expect(controller.fetchList).toHaveBeenCalled();
      expect(RequestStore.purge).not.toHaveBeenCalled();
    });

    it('maps a 422 to the replace-in-progress delete error without refetching', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      await controller.handleDelete({ id: 9 });

      expect(setters.setActionError).toHaveBeenCalledWith('staff_photos_page.error_delete_replace_in_progress');
      expect(controller.fetchList).not.toHaveBeenCalled();
    });

    it('maps a 404 to the not-found error, purging and refetching', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      await controller.handleDelete({ id: 9 });

      expect(setters.setActionError).toHaveBeenCalledWith('staff_photos_page.error_not_found');
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'staffPhoto' });
      expect(controller.fetchList).toHaveBeenCalled();
    });

    it('maps other statuses to the generic error', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      await controller.handleDelete({ id: 9 });

      expect(setters.setActionError).toHaveBeenCalledWith('staff_photos_page.error_generic');
    });

    it('maps network errors to the generic error', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('offline')));

      await controller.handleDelete({ id: 9 });

      expect(setters.setActionError).toHaveBeenCalledWith('staff_photos_page.error_generic');
      expect(controller.fetchList).not.toHaveBeenCalled();
    });
  });
});
