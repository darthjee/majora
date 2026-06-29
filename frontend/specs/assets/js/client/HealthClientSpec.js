import HealthClient from '../../../../assets/js/client/HealthClient.js';

describe('HealthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' }),
    }));
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

    it('includes the X-Skip-Cache: 1 header', async function() {
      const client = new HealthClient();

      await client.check();

      expect(fetchSpy).toHaveBeenCalledWith('/health.json', jasmine.objectContaining({
        headers: jasmine.objectContaining({ 'X-Skip-Cache': '1' }),
      }));
    });

    it('includes an AbortSignal for request timeout', async function() {
      const client = new HealthClient();

      await client.check();

      const [, options] = fetchSpy.calls.mostRecent().args;
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });
  });
});
