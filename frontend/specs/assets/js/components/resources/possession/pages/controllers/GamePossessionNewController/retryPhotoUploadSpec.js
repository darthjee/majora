import GamePossessionNewController
  from '../../../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GamePossessionNewController', function() {
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
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/possessions/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and redirects on success, without creating a new possession', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));

      const controller = new GamePossessionNewController(Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 5, photoFile, { setStatus, setGamePossessionId });

        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'possession', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 5 },
        });
        expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
          '/games/demo/possessions/5/photo_upload.json', photoFile, 'tok-abc',
        );
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'possession' });
        expect(fakeWindow.location.hash).toBe('/games/demo/possessions');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new GamePossessionNewController(Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 5, photoFile, { setStatus, setGamePossessionId });

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGamePossessionId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
