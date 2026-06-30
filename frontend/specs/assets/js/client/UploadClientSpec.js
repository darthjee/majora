import UploadClient from '../../../../assets/js/client/UploadClient.js';

describe('UploadClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#initUpload', function() {
    it('sends a POST request with the filename and auth token', async function() {
      const client = new UploadClient();

      await client.initUpload('demo', 'cover.png', 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/photo_upload.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ filename: 'cover.png' }),
      });
    });

    it('includes the game slug in the URL', async function() {
      const client = new UploadClient();

      await client.initUpload('my-game', 'photo.jpg', 'tok-xyz');

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/games/my-game/photo_upload.json');
    });
  });

  describe('#submitUpload', function() {
    it('sends a PATCH multipart request with the upload token and file', async function() {
      const client = new UploadClient();
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      await client.submitUpload(42, 'up-token', file);

      const [url, options] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/42/submit');
      expect(options.method).toBe('PATCH');
      expect(options.headers).toEqual({ 'X-Upload-Token': 'up-token', 'X-Skip-Cache': '1' });
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get('file')).toBe(file);
    });

    it('includes the upload id in the URL', async function() {
      const client = new UploadClient();
      const file = new File(['data'], 'img.png', { type: 'image/png' });

      await client.submitUpload(99, 'some-token', file);

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/99/submit');
    });
  });
});
