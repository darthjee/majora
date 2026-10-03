import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import StaffPhotosController from '../../../../../../../../../assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildSetters, buildMountedController } from './support.js';

describe('StaffPhotosController', function() {
  let setters;
  let actions;
  let win;
  let controller;
  const photos = [{ id: 1 }, { id: 2 }, { id: 3 }];

  beforeEach(function() {
    setters = buildSetters();
    actions = jasmine.createSpyObj('actions', ['resizePhoto', 'deletePhoto']);
    win = jasmine.createSpyObj('win', ['addEventListener', 'removeEventListener']);
    controller = buildMountedController(setters, 'game', { actions, win });
    controller.maxDimension = 800;
    spyOn(RequestStore, 'purge');
    spyOn(controller, 'fetchList').and.returnValue(Promise.resolve());
  });

  describe('#runBulk', function() {
    it('resizes one at a time, continuing past a failure', async function() {
      spyOn(Date, 'now').and.returnValue(55);
      actions.resizePhoto.and.returnValues(
        Promise.resolve({ status: 'done' }),
        Promise.resolve({ status: 'failed', reason: 'staff_photos_page.error_generic', code: 500 }),
        Promise.resolve({ status: 'skipped', reason: 'staff_photos_page.skip_gif' }),
      );

      await controller.runBulk('resize', photos);

      expect(actions.resizePhoto).toHaveBeenCalledTimes(3);
      expect(actions.resizePhoto).toHaveBeenCalledWith('game', photos[2], 800, { 1: 55 });
      expect(actions.deletePhoto).not.toHaveBeenCalled();
      expect(setters.setVersions).toHaveBeenCalledOnceWith({ 1: 55 });
      expect(setters.setBulkResult).toHaveBeenCalledWith({
        action: 'resize',
        outcomes: [
          { photo: photos[0], status: 'done', reason: undefined },
          { photo: photos[1], status: 'failed', reason: 'staff_photos_page.error_generic' },
          { photo: photos[2], status: 'skipped', reason: 'staff_photos_page.skip_gif' },
        ],
      });
    });

    it('deletes with mixed outcomes and reports progress', async function() {
      actions.deletePhoto.and.returnValues(
        Promise.resolve({ status: 'failed', reason: 'staff_photos_page.error_not_found', code: 404 }),
        Promise.resolve({ status: 'done' }),
        Promise.resolve({ status: 'done' }),
      );

      await controller.runBulk('delete', photos);

      expect(actions.deletePhoto).toHaveBeenCalledTimes(3);
      expect(setters.setBulkJob.calls.allArgs()).toEqual([
        [{ action: 'delete', total: 3, done: 0 }],
        [{ action: 'delete', total: 3, done: 1 }],
        [{ action: 'delete', total: 3, done: 2 }],
        [{ action: 'delete', total: 3, done: 3 }],
        [null],
      ]);
      expect(setters.setVersions).not.toHaveBeenCalled();
      expect(setters.setBulkResult).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'delete' }));
    });

    it('purges and refetches only once at the end', async function() {
      actions.deletePhoto.and.returnValue(Promise.resolve({ status: 'done' }));

      await controller.runBulk('delete', photos);

      expect(RequestStore.purge).toHaveBeenCalledOnceWith({ resource: 'staffPhoto' });
      expect(controller.fetchList).toHaveBeenCalledTimes(1);
    });

    it('guards beforeunload while running', async function() {
      let handler;

      win.addEventListener.and.callFake((_name, fn) => {
        handler = fn;
      });
      actions.deletePhoto.and.callFake(() => {
        expect(win.removeEventListener).not.toHaveBeenCalled();
        return Promise.resolve({ status: 'done' });
      });

      await controller.runBulk('delete', photos);

      expect(win.addEventListener).toHaveBeenCalledOnceWith('beforeunload', handler);
      expect(win.removeEventListener).toHaveBeenCalledOnceWith('beforeunload', handler);

      const event = jasmine.createSpyObj('event', ['preventDefault']);

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.returnValue).toBe('');
    });

    it('clears messages and the previous result before starting', async function() {
      actions.deletePhoto.and.returnValue(Promise.resolve({ status: 'done' }));

      await controller.runBulk('delete', [photos[0]]);

      expect(setters.setActionError).toHaveBeenCalledWith(null);
      expect(setters.setActionInfo).toHaveBeenCalledWith(null);
      expect(setters.setBulkResult.calls.first().args).toEqual([null]);
    });
  });

  describe('#buildEffect cleanup', function() {
    it('removes the beforeunload listener on unmount', function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));
      const mounted = new StaffPhotosController(setters, { actions, win });

      mounted.buildEffect()()();

      expect(win.removeEventListener).toHaveBeenCalledWith('beforeunload', jasmine.any(Function));
    });
  });
});
