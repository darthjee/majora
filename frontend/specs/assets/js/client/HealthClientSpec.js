import HealthClient from '../../../../assets/js/client/HealthClient.js';
import { mockFetchJson } from '../../../support/fetchMock.js';

describe('HealthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ...mockFetchJson({ status: 'ok' }), status: 200 }));
  });

  describe('#check', function() {
    it('sends a GET request to /health.json with Accept: application/json', async function() {
      const client = new HealthClient();

      await client.check();

      expect(fetchSpy).toHaveBeenCalledWith('/health.json', jasmine.objectContaining({
        method: 'GET',
        headers: jasmine.objectContaining({ Accept: 'application/json' }),
      }));
    });

    it('includes the X-Skip-Cache: true header', async function() {
      const client = new HealthClient();

      await client.check();

      expect(fetchSpy).toHaveBeenCalledWith('/health.json', jasmine.objectContaining({
        headers: jasmine.objectContaining({ 'X-Skip-Cache': 'true' }),
      }));
    });

    it('includes an AbortSignal for request timeout', async function() {
      const client = new HealthClient();

      await client.check();

      const [, options] = fetchSpy.calls.mostRecent().args;
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('does not retry a single 502 response, so a stale status is not masked', async function() {
      fetchSpy.and.returnValue(Promise.resolve({ status: 502 }));

      const client = new HealthClient();
      const response = await client.check();

      expect(response.status).toBe(502);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
