import PhotoUploadModalController from '../../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';

describe('PhotoUploadModalController', function() {
  let setError;
  let setUploading;
  let onSuccess;
  let client;
  const file = { name: 'photo.jpg' };

  beforeEach(function() {
    setError = jasmine.createSpy('setError');
    setUploading = jasmine.createSpy('setUploading');
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      initUpload: jasmine.createSpy('initUpload'),
      submitUpload: jasmine.createSpy('submitUpload'),
    };
  });

  describe('#handleSubmit', function() {
    it('calls onSuccess when both upload steps succeed', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token', upload_type: 'image' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('/games/my-game/photo_upload.json', file, 'auth-token');

      expect(client.initUpload).toHaveBeenCalledWith(
        '/games/my-game/photo_upload.json', 'photo.jpg', 'auth-token', undefined,
      );
      expect(client.submitUpload).toHaveBeenCalledWith(1, 'up-token', file, 'image');
      expect(onSuccess).toHaveBeenCalled();
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalledWith(true);
    });

    it('forwards the given name to initUpload (issue #874)', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token', upload_type: 'file' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit(
        '/games/my-game/documents/9/file_upload.json', file, 'auth-token', 'Ancient Scroll',
      );

      expect(client.initUpload).toHaveBeenCalledWith(
        '/games/my-game/documents/9/file_upload.json', 'photo.jpg', 'auth-token', 'Ancient Scroll',
      );
    });

    it('threads the upload_type from the init response through to submitUpload (issue #726)', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 3, token: 'up-token', upload_type: 'file' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('/games/my-game/documents/9/file_upload.json', file, 'auth-token');

      expect(client.submitUpload).toHaveBeenCalledWith(3, 'up-token', file, 'file');
    });

    it('sets error when initUpload returns a non-ok response', async function() {
      client.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('/games/my-game/photo_upload.json', file, 'auth-token');

      expect(setError).toHaveBeenCalledWith(true);
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(client.submitUpload).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets error when submitUpload returns a non-ok response', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 2, token: 'up-token' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('/games/my-game/photo_upload.json', file, 'auth-token');

      expect(setError).toHaveBeenCalledWith(true);
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets error when the client throws an exception', async function() {
      client.initUpload.and.returnValue(Promise.reject(new Error('network')));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('/games/my-game/photo_upload.json', file, 'auth-token');

      expect(setError).toHaveBeenCalledWith(true);
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
