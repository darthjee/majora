import CharacterItemNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterItemNewController', function() {
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
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/items/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and redirects on success, without creating a new item', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));

      const controller = new CharacterItemNewController('npcs', Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', '9', 5, photoFile, { setStatus, setGameItemId });

        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'item', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', kind: 'game', id: 5 },
        });
        expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
          '/games/demo/items/5/photo_upload.json', photoFile, 'tok-abc',
        );
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'item' });
        expect(fakeWindow.location.hash).toBe('/games/demo/npcs/9/items');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new CharacterItemNewController('npcs', Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', '9', 5, photoFile, { setStatus, setGameItemId });

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameItemId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
