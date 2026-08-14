import PhotoUploadSaga
  from '../../../../../../../assets/js/components/common/base/controllers/PhotoUploadSaga.js';

describe('PhotoUploadSaga', function() {
  describe('#upload', function() {
    let uploadClient;
    const photoFile = { name: 'photo.jpg' };

    beforeEach(function() {
      uploadClient = jasmine.createSpyObj('uploadClient', ['runUploadCycle']);
    });

    it('returns true when the upload cycle succeeds', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({
        ok: true, upload_id: 1, token: 'up-token', upload_type: 'image',
      }));

      const saga = new PhotoUploadSaga(uploadClient);
      const result = await saga.upload('/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc');

      expect(uploadClient.runUploadCycle).toHaveBeenCalledWith(
        '/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc',
      );
      expect(result).toBe(true);
    });

    it('returns false when the upload cycle does not succeed', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.resolve({ ok: false }));

      const saga = new PhotoUploadSaga(uploadClient);
      const result = await saga.upload('/games/demo/npcs/7/photo_upload.json', photoFile, 'tok-abc');

      expect(result).toBe(false);
    });

    it('returns false when the upload client throws', async function() {
      uploadClient.runUploadCycle.and.returnValue(Promise.reject(new Error('network error')));

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
