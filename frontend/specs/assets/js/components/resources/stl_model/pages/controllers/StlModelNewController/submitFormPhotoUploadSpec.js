import StlModelNewController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('StlModelNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm photo upload saga', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let setCreatedId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      ({
        setError, setFieldErrors, setStatus, setCreatedId,
      } = buildContext());
      stubAccessStore(true);
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, name: 'Goblin', tags: [] }),
      }));
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/miniatures/stl_models/7/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    const buildFormValues = () => ({ name: 'Goblin', tags: [], photoFile });

    it('uploads the photo and redirects when the STL model is created and the upload succeeds', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new StlModelNewController(setError, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          buildFormValues(),
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'stlModel', method: 'POST', quantityType: 'single', params: { id: 7 },
        });
        expect(uploadClient.initUpload).toHaveBeenCalledWith(
          '/miniatures/stl_models/7/photo_upload.json', 'photo.jpg', 'tok-abc',
        );
        expect(uploadClient.submitUpload).toHaveBeenCalledWith(1, 'up-token', photoFile);
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'stlModel' });
        expect(fakeWindow.location.hash).toBe('/stl_models/7');
        expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed and keeps the created id when initUpload fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new StlModelNewController(setError, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          buildFormValues(),
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCreatedId).toHaveBeenCalledWith(7);
        expect(uploadClient.submitUpload).not.toHaveBeenCalled();
        expect(RequestStore.purge).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when submitUpload fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new StlModelNewController(setError, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          buildFormValues(),
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCreatedId).toHaveBeenCalledWith(7);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when the upload client throws', async function() {
      uploadClient.initUpload.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StlModelNewController(setError, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          buildFormValues(),
          {
            setStatus, setFieldErrors, setCreatedId,
          },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCreatedId).toHaveBeenCalledWith(7);
      } finally {
        delete globalThis.window;
      }
    });
  });
});
