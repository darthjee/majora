import SourceNewController
  from '../../../../../../../../../assets/js/components/resources/source/pages/controllers/SourceNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('SourceNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#retryPhotoUpload', function() {
    let setStatus;
    let setCreatedId;
    let onSuccess;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setCreatedId = jasmine.createSpy('setCreatedId');
      onSuccess = jasmine.createSpy('onSuccess');
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/miniatures/sources/7/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and calls onSuccess on success, without creating a new source', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));
      spyOn(RequestStore, 'mutate');

      const controller = new SourceNewController(null, null, uploadClient);

      await controller.retryPhotoUpload(7, photoFile, { setStatus, setCreatedId, onSuccess });

      expect(RequestStore.mutate).not.toHaveBeenCalled();
      expect(RequestStore.resolvePath).toHaveBeenCalledWith({
        resource: 'source', method: 'POST', quantityType: 'single', params: { id: 7 },
      });
      expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
        '/miniatures/sources/7/photo_upload.json', photoFile, 'tok-abc',
      );
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'source' });
      expect(onSuccess).toHaveBeenCalledWith(7);
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new SourceNewController(null, null, uploadClient);

      await controller.retryPhotoUpload(7, photoFile, { setStatus, setCreatedId, onSuccess });

      expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
      expect(setCreatedId).toHaveBeenCalledWith(7);
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
