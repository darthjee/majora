import GameNpcNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameNpcNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#retryPhotoUpload', function() {
    let setStatus;
    let setCharacterId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setCharacterId = jasmine.createSpy('setCharacterId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/npcs/7/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and redirects on success, without creating a new NPC', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const characterClient = jasmine.createSpyObj('characterClient', ['createNpc']);
      const controller = new GameNpcNewController(null, null, characterClient, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 7, photoFile, { setStatus, setCharacterId });

        expect(characterClient.createNpc).not.toHaveBeenCalled();
        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'npc', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 7 },
        });
        expect(uploadClient.initUpload).toHaveBeenCalledWith(
          '/games/demo/npcs/7/photo_upload.json', 'photo.jpg', 'tok-abc',
        );
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'npc' });
        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/7');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new GameNpcNewController(null, null, null, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 7, photoFile, { setStatus, setCharacterId });

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setCharacterId).toHaveBeenCalledWith(7);
        expect(RequestStore.purge).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
