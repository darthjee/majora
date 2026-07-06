import PhotoUploadModalController from '../../../../../../../assets/js/components/elements/controllers/PhotoUploadModalController.js';

describe('PhotoUploadModalController', function() {
  let setError;
  let setUploading;
  let onSuccess;
  let client;

  beforeEach(function() {
    setError = jasmine.createSpy('setError');
    setUploading = jasmine.createSpy('setUploading');
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      initUpload: jasmine.createSpy('initUpload'),
      submitUpload: jasmine.createSpy('submitUpload'),
    };
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
