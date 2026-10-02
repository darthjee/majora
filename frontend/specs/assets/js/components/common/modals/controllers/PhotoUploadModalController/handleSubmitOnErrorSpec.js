import PhotoUploadModalController from '../../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';

describe('PhotoUploadModalController', function() {
  let setError;
  let setUploading;
  let onSuccess;
  let onError;
  let client;
  const file = { name: 'photo.jpg' };

  beforeEach(function() {
    setError = jasmine.createSpy('setError');
    setUploading = jasmine.createSpy('setUploading');
    onSuccess = jasmine.createSpy('onSuccess');
    onError = jasmine.createSpy('onError');
    client = { runUploadCycle: jasmine.createSpy('runUploadCycle') };
  });

  describe('#handleSubmit onError (issue #1473)', function() {
    it('calls onError with the status when the upload cycle is not ok', async function() {
      client.runUploadCycle.and.returnValue(Promise.resolve({ ok: false, status: 409 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client, onError);

      await controller.handleSubmit('/staff/photos/game/1/replace.json', file, 'auth-token');

      expect(onError).toHaveBeenCalledOnceWith(409);
      expect(setError).toHaveBeenCalledWith(true);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('does not call onError when the upload cycle succeeds', async function() {
      client.runUploadCycle.and.returnValue(Promise.resolve({ ok: true, status: 201 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client, onError);

      await controller.handleSubmit('/staff/photos/game/1/replace.json', file, 'auth-token');

      expect(onError).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('does not call onError when the client throws', async function() {
      client.runUploadCycle.and.returnValue(Promise.reject(new Error('network')));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client, onError);

      await controller.handleSubmit('/staff/photos/game/1/replace.json', file, 'auth-token');

      expect(onError).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
    });

    it('defaults onError to a no-op', async function() {
      client.runUploadCycle.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const controller = new PhotoUploadModalController(setError, setUploading, onSuccess, client);

      await expectAsync(
        controller.handleSubmit('/staff/photos/game/1/replace.json', file, 'auth-token'),
      ).toBeResolved();
    });
  });
});
