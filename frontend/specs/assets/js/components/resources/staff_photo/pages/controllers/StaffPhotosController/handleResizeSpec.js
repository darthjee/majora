import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSetters, buildMountedController } from './support.js';

describe('StaffPhotosController', function() {
  let setters;
  let actions;
  let controller;
  const photo = { id: 4, path: '/photos/game/4.jpg' };

  beforeEach(function() {
    setters = buildSetters();
    actions = jasmine.createSpyObj('actions', ['resizePhoto', 'deletePhoto']);
    controller = buildMountedController(setters, 'game', { actions });
    controller.maxDimension = 1000;
    spyOn(RequestStore, 'purge');
    spyOn(controller, 'fetchList').and.returnValue(Promise.resolve());
  });

  describe('#handleResize', function() {
    it('resizes with the active type, max dimension and versions', async function() {
      actions.resizePhoto.and.returnValue(Promise.resolve({ status: 'done' }));
      controller.versions = { 4: 1 };

      await controller.handleResize(photo);

      expect(actions.resizePhoto).toHaveBeenCalledWith('game', photo, 1000, { 4: 1 });
    });

    it('on done purges, bumps the version and refetches', async function() {
      actions.resizePhoto.and.returnValue(Promise.resolve({ status: 'done' }));
      spyOn(Date, 'now').and.returnValue(321);

      await controller.handleResize(photo);

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'staffPhoto' });
      expect(setters.setVersions).toHaveBeenCalledWith({ 4: 321 });
      expect(controller.fetchList).toHaveBeenCalled();
      expect(setters.setActionError).not.toHaveBeenCalledWith(jasmine.any(String));
    });

    it('on skipped shows the reason as info', async function() {
      actions.resizePhoto.and.returnValue(Promise.resolve({ status: 'skipped', reason: 'staff_photos_page.skip_gif' }));

      await controller.handleResize(photo);

      expect(setters.setActionInfo).toHaveBeenCalledWith(null);
      expect(setters.setActionInfo).toHaveBeenCalledWith('staff_photos_page.skip_gif');
      expect(controller.fetchList).not.toHaveBeenCalled();
    });

    [
      [409, 'staff_photos_page.error_replace_in_progress'],
      [422, 'staff_photos_page.error_path_missing'],
    ].forEach(([code, reason]) => {
      it(`on a ${code} failure shows the error without refetching`, async function() {
        actions.resizePhoto.and.returnValue(Promise.resolve({ status: 'failed', reason, code }));

        await controller.handleResize(photo);

        expect(setters.setActionError).toHaveBeenCalledWith(reason);
        expect(RequestStore.purge).not.toHaveBeenCalled();
        expect(controller.fetchList).not.toHaveBeenCalled();
      });
    });

    it('on a 404 failure purges and refetches', async function() {
      actions.resizePhoto.and.returnValue(Promise.resolve({
        status: 'failed', reason: 'staff_photos_page.error_not_found', code: 404,
      }));

      await controller.handleResize(photo);

      expect(setters.setActionError).toHaveBeenCalledWith('staff_photos_page.error_not_found');
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'staffPhoto' });
      expect(controller.fetchList).toHaveBeenCalled();
    });
  });
});
