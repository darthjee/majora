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
  });
});
