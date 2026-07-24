import GameItemNewController
  from '../../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GameItemNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#retryPhotoUpload', function() {
    let setStatus;
    let setGameItemId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setGameItemId = jasmine.createSpy('setGameItemId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/items/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and redirects on success, without creating a new item', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new GameItemNewController(Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 5, photoFile, { setStatus, setGameItemId });

        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'item', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', kind: 'game', id: 5 },
        });
        expect(uploadClient.initUpload).toHaveBeenCalledWith(
          '/games/demo/items/5/photo_upload.json', 'photo.jpg', 'tok-abc',
        );
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'item' });
        expect(fakeWindow.location.hash).toBe('/games/demo/items');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new GameItemNewController(Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 5, photoFile, { setStatus, setGameItemId });

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameItemId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
