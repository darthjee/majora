import GameCommonItemNewController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GameCommonItemNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm photo upload saga', function() {
    let setFieldErrors;
    let setStatus;
    let setGameCommonItemId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      setGameCommonItemId = jasmine.createSpy('setGameCommonItemId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 5, name: 'Healing Potion', description: '', price: 50, category: 'potion', photo_path: null,
          hidden: false,
        }),
      }));
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/common_items/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    const buildFormValues = () => ({
      name: 'Healing Potion', description: '', price: '50', category: 'potion', hidden: false, photoFile,
    });

    it('uploads the photo against the created common item id and redirects when the upload succeeds',
      async function() {
        uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));

        const controller = new GameCommonItemNewController(Noop.noop, setFieldErrors, uploadClient);
        const fakeWindow = { location: { hash: '' } };
        globalThis.window = fakeWindow;

        try {
          await controller.submitForm(
            undefined,
            'demo',
            buildFormValues(),
            { setStatus, setFieldErrors, setGameCommonItemId },
          );

          expect(RequestStore.resolvePath).toHaveBeenCalledWith({
            resource: 'commonItem', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 5 },
          });
          expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
            '/games/demo/common_items/5/photo_upload.json', photoFile, 'tok-abc',
          );
          expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'commonItem' });
          expect(fakeWindow.location.hash).toBe('/games/demo/common_items');
          expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
        } finally {
          delete globalThis.window;
        }
      });

    it('sets status to photo-upload-failed and stores the common item id when initUpload fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new GameCommonItemNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameCommonItemId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameCommonItemId).toHaveBeenCalledWith(5);
        expect(RequestStore.purge).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when submitUpload fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false, upload_id: 1, token: 'up-token' }));

      const controller = new GameCommonItemNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameCommonItemId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameCommonItemId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when the upload client throws', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameCommonItemNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameCommonItemId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameCommonItemId).toHaveBeenCalledWith(5);
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects without uploading when no photo was picked', async function() {
      const controller = new GameCommonItemNewController(Noop.noop, setFieldErrors, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          {
            name: 'Healing Potion', description: '', price: '50', category: 'potion', hidden: false, photoFile: null,
          },
          { setStatus, setFieldErrors, setGameCommonItemId },
        );

        expect(uploadClient.runUploadCycle).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('/games/demo/common_items');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
