import UploadClient from '../../../../../assets/js/client/UploadClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('UploadClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#submitUpload', function() {
    it('sends a POST multipart request with the upload token and file', async function() {
      const client = new UploadClient();
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      await client.submitUpload(42, 'up-token', file, 'image');

      const [url, options] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/image/42/submit');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'X-Upload-Token': 'up-token', 'X-Skip-Cache': 'true' });
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get('file')).toBe(file);
    });

    it('includes the upload id and upload type in the URL', async function() {
      const client = new UploadClient();
      const file = new File(['data'], 'img.png', { type: 'image/png' });

      await client.submitUpload(99, 'some-token', file, 'image');

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/image/99/submit');
    });

    it('builds the URL with the given upload type for file uploads', async function() {
      const client = new UploadClient();
      const file = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });

      await client.submitUpload(7, 'file-token', file, 'file');

      const [url] = fetchSpy.calls.mostRecent().args;

      expect(url).toBe('/uploads/file/7/submit');
    });

    it('passes an explicit AbortSignal distinct from the default timeout signal', async function() {
      const client = new UploadClient();
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      await client.submitUpload(42, 'up-token', file, 'image');

      const [, options] = fetchSpy.calls.mostRecent().args;

      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.signal).not.toBe(undefined);
    });
  });
});
