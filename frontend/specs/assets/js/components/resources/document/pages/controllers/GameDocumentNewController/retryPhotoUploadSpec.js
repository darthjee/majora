import GameDocumentNewController
  from '../../../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentNewController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('GameDocumentNewController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#retryPhotoUpload', function() {
    let setStatus;
    let setGameDocumentId;
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      setStatus = jasmine.createSpy('setStatus');
      setGameDocumentId = jasmine.createSpy('setGameDocumentId');
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(RequestStore, 'resolvePath').and.returnValue(
        Promise.resolve('/games/demo/documents/5/photo_upload.json'),
      );
      spyOn(RequestStore, 'purge');
    });

    it('re-runs the upload-only path and redirects on success, without creating a new document', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, upload_id: 1, token: 'up-token' }));

      const controller = new GameDocumentNewController(Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 5, photoFile, { setStatus, setGameDocumentId });

        expect(RequestStore.resolvePath).toHaveBeenCalledWith({
          resource: 'document', method: 'POST', quantityType: 'single', params: { gameSlug: 'demo', id: 5 },
        });
        expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
          '/games/demo/documents/5/photo_upload.json', photoFile, 'tok-abc',
        );
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
        expect(fakeWindow.location.hash).toBe('/games/demo/documents');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status back to photo-upload-failed when the retry also fails', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const controller = new GameDocumentNewController(Noop.noop, Noop.noop, uploadClient);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.retryPhotoUpload('demo', 5, photoFile, { setStatus, setGameDocumentId });

        expect(setStatus).toHaveBeenCalledWith('photo-upload-failed');
        expect(setGameDocumentId).toHaveBeenCalledWith(5);
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });
  });
});
