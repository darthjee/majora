import FactionNewController
  from '../../../../../../../../../assets/js/components/resources/faction/pages/controllers/FactionNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('FactionNewController', function() {
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
        json: () => Promise.resolve({ id: 7, name: 'The Silver Hand' }),
      }));
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/factions/7/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    const buildFormValues = () => ({ name: 'The Silver Hand', photoFile });

    it('uploads the photo and calls onSuccess when the faction is created and the upload succeeds', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));

      const controller = new FactionNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        'demo',
        buildFormValues(),
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(RequestStore.resolvePath).toHaveBeenCalledWith({
        resource: 'faction', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 7 },
      });
      expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
        '/games/demo/factions/7/photo_upload.json', photoFile, 'tok-abc',
      );
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'faction' });
      expect(onSuccess).toHaveBeenCalledWith(7);
      expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
    });

    it('sets status to photo-upload-failed and keeps the created id when initUpload fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new FactionNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        'demo',
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

      const controller = new FactionNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        'demo',
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

      const controller = new FactionNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        'demo',
        buildFormValues(),
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
      expect(setCreatedId).toHaveBeenCalledWith(7);
    });

    it('calls onSuccess without uploading when no photo was picked', async function() {
      const controller = new FactionNewController(setError, setFieldErrors, uploadClient);

      await controller.submitForm(
        undefined,
        'demo',
        { name: 'The Silver Hand', photoFile: null },
        {
          setStatus, setFieldErrors, setCreatedId, onSuccess,
        },
      );

      expect(uploadClient.runUploadCycle).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(7);
    });
  });
});
