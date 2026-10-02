import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSetters, buildMountedController } from './support.js';

describe('StaffPhotosController', function() {
  let setters;
  let controller;

  beforeEach(function() {
    setters = buildSetters();
    controller = buildMountedController(setters, 'character');
    spyOn(RequestStore, 'purge');
    spyOn(controller, 'fetchList').and.returnValue(Promise.resolve());
  });

  describe('#handleReplaceSuccess', function() {
    it('purges, records a version for the photo and refetches', async function() {
      spyOn(Date, 'now').and.returnValues(111, 222);

      await controller.handleReplaceSuccess({ id: 4 });
      await controller.handleReplaceSuccess({ id: 5 });

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'staffPhoto' });
      expect(setters.setVersions).toHaveBeenCalledWith({ 4: 111 });
      expect(setters.setVersions).toHaveBeenCalledWith({ 4: 111, 5: 222 });
      expect(setters.setActionError).toHaveBeenCalledWith(null);
      expect(controller.fetchList).toHaveBeenCalledTimes(2);
    });
  });

  describe('#handleReplaceError', function() {
    const cases = [
      [409, 'staff_photos_page.error_replace_in_progress'],
      [422, 'staff_photos_page.error_path_missing'],
      [500, 'staff_photos_page.error_generic'],
      [undefined, 'staff_photos_page.error_generic'],
    ];

    cases.forEach(([status, key]) => {
      it(`maps ${status} to ${key} without refetching`, async function() {
        await controller.handleReplaceError({ id: 4 }, status);

        expect(setters.setActionError).toHaveBeenCalledWith(key);
        expect(controller.fetchList).not.toHaveBeenCalled();
        expect(RequestStore.purge).not.toHaveBeenCalled();
      });
    });

    it('maps a 404 to the not-found error, purging and refetching', async function() {
      await controller.handleReplaceError({ id: 4 }, 404);

      expect(setters.setActionError).toHaveBeenCalledWith('staff_photos_page.error_not_found');
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'staffPhoto' });
      expect(controller.fetchList).toHaveBeenCalled();
    });
  });

  describe('#replacePath', function() {
    it('builds the staff replace path for the active type', function() {
      expect(controller.replacePath({ id: 4 })).toBe('/staff/photos/character/4/replace.json');
    });
  });
});
