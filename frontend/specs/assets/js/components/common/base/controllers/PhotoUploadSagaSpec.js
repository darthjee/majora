import PhotoUploadSaga
  from '../../../../../../../assets/js/components/common/base/controllers/PhotoUploadSaga.js';

describe('PhotoUploadSaga', function() {
  describe('#upload', function() {
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      uploadClient = jasmine.createSpyObj('uploadClient', ['initUpload', 'submitUpload']);
    });

    it('returns true when init and submit both succeed', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const saga = new PhotoUploadSaga(uploadClient);
      const result = await saga.upload('/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc');

      expect(uploadClient.initUpload).toHaveBeenCalledWith(
        '/games/demo/npcs/7/photo_upload.json', 'photo.jpg', 'tok-abc',
      );
      expect(uploadClient.submitUpload).toHaveBeenCalledWith(1, 'up-token', photoFile);
      expect(result).toBe(true);
    });

    it('returns false when initUpload does not respond ok', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const saga = new PhotoUploadSaga(uploadClient);
      const result = await saga.upload('/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc');

      expect(uploadClient.submitUpload).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('returns false when submitUpload does not respond ok', async function() {
      uploadClient.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token' }),
      }));
      uploadClient.submitUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const saga = new PhotoUploadSaga(uploadClient);
      const result = await saga.upload('/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc');

      expect(result).toBe(false);
    });

    it('returns false when the upload client throws', async function() {
      uploadClient.initUpload.and.returnValue(Promise.reject(new Error('network error')));

      const saga = new PhotoUploadSaga(uploadClient);
      const result = await saga.upload('/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc');

      expect(result).toBe(false);
    });

    it('builds its own UploadClient when none is injected', function() {
      const saga = new PhotoUploadSaga();

      expect(saga.uploadClient).toBeTruthy();
    });
  });
});
