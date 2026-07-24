import GameItemNewController
  from '../../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GameItemNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm photo upload saga', function() {
    let setFieldErrors;
    let setStatus;
    let setGameItemId;
    let gameClient;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      setGameItemId = jasmine.createSpy('setGameItemId');
      gameClient = jasmine.createSpyObj('gameClient', ['createItem']);
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      gameClient.createItem.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 5, name: 'Sword', description: '', photo_path: null, hidden: false,
        }),
      }));
    });

    const buildFormValues = () => ({
      name: 'Sword', description: '', hidden: false, photoFile,
    });

    it('uploads the photo against the created item id and redirects when the upload succeeds', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new GameItemNewController(Noop.noop, setFieldErrors, gameClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameItemId },
        );

        expect(uploadClient.initUpload).toHaveBeenCalledWith(
          '/games/demo/items/5/photo_upload.json', 'photo.jpg', 'tok-abc',
        );
        expect(uploadClient.submitUpload).toHaveBeenCalledWith(1, 'up-token', photoFile);
        expect(fakeWindow.location.hash).toBe('/games/demo/items');
        expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed and stores the item id when initUpload fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new GameItemNewController(Noop.noop, setFieldErrors, gameClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameItemId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameItemId).toHaveBeenCalledWith(5);
        expect(uploadClient.submitUpload).not.toHaveBeenCalled();
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

      const controller = new GameItemNewController(Noop.noop, setFieldErrors, gameClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameItemId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameItemId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when the upload client throws', async function() {
      uploadClient.initUpload.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameItemNewController(Noop.noop, setFieldErrors, gameClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setGameItemId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameItemId).toHaveBeenCalledWith(5);
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects without uploading when no photo was picked', async function() {
      const controller = new GameItemNewController(Noop.noop, setFieldErrors, gameClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          { name: 'Sword', description: '', hidden: false, photoFile: null },
          { setStatus, setFieldErrors, setGameItemId },
        );

        expect(uploadClient.initUpload).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('/games/demo/items');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
