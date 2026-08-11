import StlModelNewController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StlModelNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#retryPhotoUpload', function() {
    let setStatus;
    let setCreatedId;
    let uploadClient;
    let fakeWindow;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setCreatedId = jasmine.createSpy('setCreatedId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/miniatures/stl_models/7/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
      fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('re-runs the upload-only path and redirects to the show page on success, without creating a new '
      + 'STL model', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));
      spyOn(RequestStore, 'mutate');

      const controller = new StlModelNewController(null, null, uploadClient);

      await controller.retryPhotoUpload(7, photoFile, { setStatus, setCreatedId });

      expect(RequestStore.mutate).not.toHaveBeenCalled();
      expect(RequestStore.resolvePath).toHaveBeenCalledWith({
        resource: 'stlModel', method: 'POST', quantityType: 'single', params: { id: 7 },
      });
      expect(uploadClient.initUpload).toHaveBeenCalledWith(
        '/miniatures/stl_models/7/photo_upload.json', 'photo.jpg', 'tok-abc',
      );
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'stlModel' });
      expect(fakeWindow.location.hash).toBe('/miniatures/stl_models/7');
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new StlModelNewController(null, null, uploadClient);

      await controller.retryPhotoUpload(7, photoFile, { setStatus, setCreatedId });

      expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
      expect(setCreatedId).toHaveBeenCalledWith(7);
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(fakeWindow.location.hash).toBe('');
    });
  });
});
