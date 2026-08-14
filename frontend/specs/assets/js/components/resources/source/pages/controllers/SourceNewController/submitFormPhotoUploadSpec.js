import SourceNewController
  from '../../../../../../../../../assets/js/components/resources/source/pages/controllers/SourceNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('SourceNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm photo upload saga', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let setCreatedId;
    let onSuccess;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      ({
        setError, setFieldErrors, setStatus, setCreatedId, onSuccess,
      } = buildContext());
      stubAccessStore(true);
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, name: 'MyMiniFactory', url: '' }),
      }));
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/miniatures/sources/7/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    const buildFormValues = () => ({ name: 'MyMiniFactory', url: '', photoFile });

    it('uploads the photo and calls onSuccess when the source is created and the upload succeeds', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));

      const controller = new SourceNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        buildFormValues(),
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(RequestStore.resolvePath).toHaveBeenCalledWith({
        resource: 'source', method: 'POST', quantityType: 'single', params: { id: 7 },
      });
      expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
        '/miniatures/sources/7/photo_upload.json', photoFile, 'tok-abc',
      );
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'source' });
      expect(onSuccess).toHaveBeenCalledWith(7);
      expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
    });

    it('sets status to photo-upload-failed and keeps the created id when initUpload fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new SourceNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        buildFormValues(),
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
      expect(setCreatedId).toHaveBeenCalledWith(7);
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to photo-upload-failed when submitUpload fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false, upload_id: 1, token: 'up-token' }));

      const controller = new SourceNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        buildFormValues(),
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
      expect(setCreatedId).toHaveBeenCalledWith(7);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets status to photo-upload-failed when the upload client throws', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new SourceNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        buildFormValues(),
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
      expect(setCreatedId).toHaveBeenCalledWith(7);
    });
  });
});
