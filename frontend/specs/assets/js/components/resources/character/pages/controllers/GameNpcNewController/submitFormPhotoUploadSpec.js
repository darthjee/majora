import GameNpcNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('GameNpcNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm photo upload saga', function() {
    let setError;
    let setFieldErrors;
    let setStatus;
    let setCharacterId;
    let characterClient;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      setCharacterId = jasmine.createSpy('setCharacterId');
      characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      characterClient.createNpc.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ id: 7, name: 'Goblin King', game_slug: 'demo' }),
      }));
    });

    const buildFormValues = () => ({
      name: 'Goblin King', role: '', description: '', privateDescription: '', hidden: false, money: '0', photoFile,
    });

    it('uploads the photo and redirects when the NPC is created and the upload succeeds', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setCharacterId },
        );

        expect(uploadClient.initUpload).toHaveBeenCalledWith(
          '/games/demo/npcs/7/photo_upload.json', 'photo.jpg', 'tok-abc',
        );
        expect(uploadClient.submitUpload).toHaveBeenCalledWith(1, 'up-token', photoFile);
        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/7');
        expect(setStatus).not.toHaveBeenCalledWith('photo-upload-failed');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed and keeps the character id when initUpload fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setCharacterId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCharacterId).toHaveBeenCalledWith(7);
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

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setCharacterId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCharacterId).toHaveBeenCalledWith(7);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to photo-upload-failed when the upload client throws', async function() {
      uploadClient.initUpload.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameNpcNewController(setError, setFieldErrors, characterClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          'demo',
          buildFormValues(),
          { setStatus, setFieldErrors, setCharacterId },
        );

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCharacterId).toHaveBeenCalledWith(7);
      } finally {
        delete globalThis.window;
      }
    });
  });
});
