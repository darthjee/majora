import UploadClient from '../../../../../assets/js/client/UploadClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('UploadClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#initUpload', function() {
    it('sends a POST request with the filename and auth token', async function() {
      const client = new UploadClient();

      await client.initUpload('/games/demo/photo_upload.json', 'cover.png', 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/photo_upload.json', jasmine.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ filename: 'cover.png' }),
      }));
    });

    it('posts to the exact path given for a game', async function() {
      const client = new UploadClient();

      await client.initUpload('/games/my-game/photo_upload.json', 'photo.jpg', 'tok-xyz');

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/games/my-game/photo_upload.json');
    });

    it('posts to the exact path given for a character', async function() {
      const client = new UploadClient();

      await client.initUpload('/games/my-game/pcs/7/photo_upload.json', 'photo.jpg', 'tok-xyz');

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/games/my-game/pcs/7/photo_upload.json');
    });

    it('includes the given name in the request body (issue #874)', async function() {
      const client = new UploadClient();

      await client.initUpload('/games/demo/documents/9/file_upload.json', 'scroll.pdf', 'tok-abc', 'Ancient Scroll');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/documents/9/file_upload.json', jasmine.objectContaining({
        body: JSON.stringify({ filename: 'scroll.pdf', name: 'Ancient Scroll' }),
      }));
    });

    it('omits the name from the request body when it is blank', async function() {
      const client = new UploadClient();

      await client.initUpload('/games/demo/documents/9/file_upload.json', 'scroll.pdf', 'tok-abc', '');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/documents/9/file_upload.json', jasmine.objectContaining({
        body: JSON.stringify({ filename: 'scroll.pdf' }),
      }));
    });

    it('passes an explicit AbortSignal distinct from the default timeout signal', async function() {
      const client = new UploadClient();

      await client.initUpload('/games/demo/photo_upload.json', 'cover.png', 'tok-abc');

      const [, options] = fetchSpy.calls.mostRecent().args;

      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.signal).not.toBe(undefined);
    });
  });
});
