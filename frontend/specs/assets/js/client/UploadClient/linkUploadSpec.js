import UploadClient from '../../../../../assets/js/client/UploadClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('UploadClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#linkUpload', function() {
    it('sends a body-less POST to the link URL with the upload token', async function() {
      const client = new UploadClient();

      await client.linkUpload('image', 42, 'up-token');

      const [url, options] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/link/image/42/submit');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'X-Upload-Token': 'up-token', 'X-Skip-Cache': 'true' });
      expect(options.body).toBeUndefined();
    });

    it('builds the URL with the given upload type for file uploads', async function() {
      const client = new UploadClient();

      await client.linkUpload('file', 7, 'file-token');

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/link/file/7/submit');
    });

    it('returns the fetch response', async function() {
      const client = new UploadClient();

      const response = await client.linkUpload('image', 1, 'token');

      expect(response).toBe(await fetchSpy.calls.mostRecent().returnValue);
    });
  });
});
