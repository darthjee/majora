import HealthClient from '../../../../assets/js/client/HealthClient.js';

describe('HealthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    }));
  });

  describe('#check', function() {
    it('sends a GET request to /health.json with Accept: application/json', async function() {
      const client = new HealthClient();

      await client.check();

      expect(fetchSpy).toHaveBeenCalledWith('/health.json', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      });
    });
  });
});
