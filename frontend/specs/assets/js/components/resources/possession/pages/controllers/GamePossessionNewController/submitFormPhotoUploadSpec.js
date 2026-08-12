import GamePossessionNewController
  from '../../../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GamePossessionNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm photo upload saga', function() {
    let setFieldErrors;
    let setStatus;
    let setGamePossessionId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      setGamePossessionId = jasmine.createSpy('setGamePossessionId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 5, name: 'Old Tavern', description: '', photo_path: null, hidden: false,
        }),
      }));
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/possessions/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    const buildFormValues = () => ({
      name: 'Old Tavern', description: '', hidden: false, photoFile,
    });

    it('uploads the photo against the created possession id and redirects when the upload succeeds',
      async function() {
        uploadClient.initUpload.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
        }));
        uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

        const controller = new GamePossessionNewController(Noop.noop, setFieldErrors, uploadClient);
        const fakeWindow = { location: { hash: '' } };
        globalThis.window = fakeWindow;

        try {
          await controller.submitForm(
            undefined,
            'demo',
            buildFormValues(),
            { setStatus, setFieldErrors, setGamePossessionId },
          );

          expect(RequestStore.resolvePath).toHaveBeenCalledWith({
            resource: 'possession', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 5 },
          });
          expect(uploadClient.initUpload).toHaveBeenCalledWith(
            '/games/demo/possessions/5/photo_upload.json', 'photo.jpg', 'tok-abc',
          );
          expect(uploadClient.submitUpload).toHaveBeenCalledWith(1, 'up-token', photoFile);
          expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'possession' });
          expect(fakeWindow.location.hash).toBe('/games/demo/possessions');
          expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
        } finally {
          delete globalThis.window;
        }
      });

    it('sets status to photo-upload-failed and stores the possession id when initUpload fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new GamePossessionNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGamePossessionId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGamePossessionId).toHaveBeenCalledWith(5);
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

      const controller = new GamePossessionNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGamePossessionId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGamePossessionId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when the upload client throws', async function() {
      uploadClient.initUpload.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GamePossessionNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGamePossessionId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGamePossessionId).toHaveBeenCalledWith(5);
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects without uploading when no photo was picked', async function() {
      const controller = new GamePossessionNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Old Tavern', description: '', hidden: false, photoFile: null },
          { setStatus, setFieldErrors, setGamePossessionId },
        );

        expect(uploadClient.initUpload).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('/games/demo/possessions');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
