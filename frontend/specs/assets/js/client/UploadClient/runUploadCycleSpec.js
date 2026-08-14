import UploadClient from '../../../../../assets/js/client/UploadClient.js';

describe('UploadClient', function() {
  describe('#runUploadCycle', function() {
    let client;
    const file = { name: 'photo.jpg' };

    beforeEach(function() {
      client = new UploadClient();
      spyOn(client, 'initUpload');
      spyOn(client, 'submitUpload');
    });

    it('short-circuits to { ok: false } without calling submitUpload when init does not respond ok', async function() {
      client.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const result = await client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc');

      expect(client.initUpload).toHaveBeenCalledWith(
        '/games/demo/photo_upload.json', 'photo.jpg', 'tok-abc', undefined,
      );
      expect(client.submitUpload).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false });
    });

    it('calls submitUpload with the upload_type taken from the init response body', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token', upload_type: 'image' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      await client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc');

      expect(client.submitUpload).toHaveBeenCalledWith(1, 'up-token', file, 'image');
    });

    it('resolves to { ok: true, ...initData } when submitUpload responds ok', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token', upload_type: 'image', id: 42 }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: true }));

      const result = await client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc');

      expect(result).toEqual({
        ok: true, upload_id: 1, token: 'up-token', upload_type: 'image', id: 42,
      });
    });

    it('resolves to { ok: false, ...initData } when submitUpload does not respond ok', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token', upload_type: 'image' }),
      }));
      client.submitUpload.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const result = await client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc');

      expect(result).toEqual({ ok: false, upload_id: 1, token: 'up-token', upload_type: 'image' });
    });

    it('forwards the given name to initUpload', async function() {
      client.initUpload.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      await client.runUploadCycle('/games/demo/documents/9/file_upload.json', file, 'tok-abc', 'Ancient Scroll');

      expect(client.initUpload).toHaveBeenCalledWith(
        '/games/demo/documents/9/file_upload.json', 'photo.jpg', 'tok-abc', 'Ancient Scroll',
      );
    });

    it('propagates a thrown error from initUpload instead of swallowing it', async function() {
      client.initUpload.and.returnValue(Promise.reject(new Error('network error')));

      await expectAsync(
        client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc'),
      ).toBeRejectedWithError('network error');

      expect(client.submitUpload).not.toHaveBeenCalled();
    });

    it('propagates a thrown error from submitUpload instead of swallowing it', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ upload_id: 1, token: 'up-token', upload_type: 'image' }),
      }));
      client.submitUpload.and.returnValue(Promise.reject(new Error('submit failed')));

      await expectAsync(
        client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc'),
      ).toBeRejectedWithError('submit failed');
    });

    it('propagates a malformed init response body (JSON parse failure)', async function() {
      client.initUpload.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('invalid json')),
      }));

      await expectAsync(
        client.runUploadCycle('/games/demo/photo_upload.json', file, 'tok-abc'),
      ).toBeRejectedWithError('invalid json');

      expect(client.submitUpload).not.toHaveBeenCalled();
    });
  });
});
