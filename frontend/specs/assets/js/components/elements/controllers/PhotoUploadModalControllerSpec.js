import PhotoUploadModalController from '../../../../../../assets/js/components/elements/controllers/PhotoUploadModalController.js';

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
        json: () => Promise.resolve({ id: 1, token: 'up-token' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('my-game', file, 'auth-token');

      expect(client.initUpload).toHaveBeenCalledWith('my-game', 'photo.jpg', 'auth-token');
      expect(client.submitUpload).toHaveBeenCalledWith(1, 'up-token', file);
      expect(onSuccess).toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalledWith(true);
    });

    it('sets error when initUpload returns a non-ok response', async function() {
      client.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('my-game', file, 'auth-token');

      expect(setError).toHaveBeenCalledWith(true);
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(client.submitUpload).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets error when submitUpload returns a non-ok response', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, token: 'up-token' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('my-game', file, 'auth-token');

      expect(setError).toHaveBeenCalledWith(true);
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('sets error when the client throws an exception', async function() {
      client.initUpload.and.returnValue(Promise.reject(new Error('network')));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await controller.handleSubmit('my-game', file, 'auth-token');

      expect(setError).toHaveBeenCalledWith(true);
      expect(setUploading).toHaveBeenCalledWith(false);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('#handleClear', function() {
    it('resets the error and uploading flags', function() {
      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      controller.handleClear();

      expect(setError).toHaveBeenCalledWith(false);
      expect(setUploading).toHaveBeenCalledWith(false);
    });
  });
});
