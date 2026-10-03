import StaffPhotoActions from '../../../../../../../../assets/js/components/resources/staff_photo/pages/controllers/StaffPhotoActions.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffPhotoActions', function() {
  let uploadClient;
  let resizer;
  let actions;
  const photo = { id: 9, path: '/photos/game/9.jpg' };

  beforeEach(function() {
    uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
    resizer = jasmine.createSpyObj('resizer', ['resize']);
    actions = new StaffPhotoActions({ uploadClient, resizer });
    spyOn(AuthStorage, 'getToken').and.returnValue('tok');
  });

  describe('.replacePath', function() {
    it('builds the staff replace path', function() {
      expect(StaffPhotoActions.replacePath('game', photo)).toBe('/staff/photos/game/9/replace.json');
    });
  });

  describe('#deletePhoto', function() {
    let mutateSpy;

    beforeEach(function() {
      mutateSpy = spyOn(RequestStore, 'mutate');
    });

    it('returns done on success', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, status: 204 }));

      expect(await actions.deletePhoto('game', photo)).toEqual({ status: 'done' });
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'DELETE', params: { photoType: 'game', id: 9 },
      }));
    });

    it('returns failed with the mapped key and code', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      expect(await actions.deletePhoto('game', photo)).toEqual({
        status: 'failed', reason: 'staff_photos_page.error_delete_replace_in_progress', code: 422,
      });
    });

    it('maps network errors to the generic error', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('offline')));

      expect(await actions.deletePhoto('game', photo)).toEqual({
        status: 'failed', reason: 'staff_photos_page.error_generic', code: undefined,
      });
    });
  });

  describe('#resizePhoto', function() {
    const file = { name: '9.jpg' };

    it('passes the versions to the resizer', async function() {
      resizer.resize.and.returnValue(Promise.resolve({ status: 'skipped', reason: 'skip_gif' }));

      await actions.resizePhoto('game', photo, 1000, { 9: 5 });

      expect(resizer.resize).toHaveBeenCalledWith(photo, 1000, { versions: { 9: 5 } });
    });

    it('prefixes the skip reason without uploading', async function() {
      resizer.resize.and.returnValue(Promise.resolve({ status: 'skipped', reason: 'skip_gif' }));

      expect(await actions.resizePhoto('game', photo, 1000)).toEqual({
        status: 'skipped', reason: 'staff_photos_page.skip_gif',
      });
      expect(uploadClient.runUploadCycle).not.toHaveBeenCalled();
    });

    it('prefixes the resize failure reason', async function() {
      resizer.resize.and.returnValue(Promise.resolve({ status: 'failed', reason: 'error_resize_load_failed' }));

      expect(await actions.resizePhoto('game', photo, 1000)).toEqual({
        status: 'failed', reason: 'staff_photos_page.error_resize_load_failed',
      });
    });

    it('uploads the resized file and returns done', async function() {
      resizer.resize.and.returnValue(Promise.resolve({ status: 'resized', file }));
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, status: 200 }));

      expect(await actions.resizePhoto('game', photo, 1000)).toEqual({ status: 'done' });
      expect(uploadClient.runUploadCycle).toHaveBeenCalledWith('/staff/photos/game/9/replace.json', file, 'tok');
    });

    [
      [409, 'staff_photos_page.error_replace_in_progress'],
      [422, 'staff_photos_page.error_path_missing'],
      [404, 'staff_photos_page.error_not_found'],
      [500, 'staff_photos_page.error_generic'],
    ].forEach(([status, reason]) => {
      it(`maps an upload ${status} to ${reason}`, async function() {
        resizer.resize.and.returnValue(Promise.resolve({ status: 'resized', file }));
        uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false, status }));

        expect(await actions.resizePhoto('game', photo, 1000)).toEqual({ status: 'failed', reason, code: status });
      });
    });

    it('maps upload network errors to the generic error', async function() {
      resizer.resize.and.returnValue(Promise.resolve({ status: 'resized', file }));
      uploadClient.runUploadCycle.and.returnValue(Promise.reject(new Error('offline')));

      expect(await actions.resizePhoto('game', photo, 1000)).toEqual({
        status: 'failed', reason: 'staff_photos_page.error_generic', code: undefined,
      });
    });
  });
});
