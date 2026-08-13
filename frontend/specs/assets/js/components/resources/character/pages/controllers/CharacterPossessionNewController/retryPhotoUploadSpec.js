import CharacterPossessionNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterPossessionNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#retryPhotoUpload', function() {
    let setStatus;
    let setGamePossessionId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setGamePossessionId = jasmine.createSpy('setGamePossessionId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/possessions/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and redirects on success, without creating a new possession', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new CharacterPossessionNewController('npcs', Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', '9', 5, photoFile, { setStatus, setGamePossessionId });

        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'possession', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 5 },
        });
        expect(uploadClient.initUpload).toHaveBeenCalledWith(
          '/games/demo/possessions/5/photo_upload.json', 'photo.jpg', 'tok-abc',
        );
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'possession' });
        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/9/possessions');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new CharacterPossessionNewController('npcs', Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', '9', 5, photoFile, { setStatus, setGamePossessionId });

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGamePossessionId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
