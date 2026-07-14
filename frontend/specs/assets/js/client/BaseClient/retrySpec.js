import BaseClient from '../../../../../assets/js/client/BaseClient.js';

describe('BaseClient', function() {
  describe('retry behavior', function() {
    let fetchSpy;
    let client;

    beforeEach(function() {
      fetchSpy = spyOn(globalThis, 'fetch');
      client = new BaseClient();
    });

    it('retries a GET request through ResilientRequest by default on a 502 response', async function() {
      jasmine.clock().install();

      try {
        fetchSpy.and.returnValues(
          Promise.resolve({ status: 502 }),
          Promise.resolve({ status: 200 })
        );

        const promise = client.request('/some/path.json');

        await Promise.resolve();
        await Promise.resolve();
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        jasmine.clock().tick(5000);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        const response = await promise;

        expect(response).toEqual({ status: 200 });
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('does not retry a POST request on a 502 response', async function() {
      fetchSpy.and.returnValue(Promise.resolve({ status: 502 }));

      const response = await client.request('/some/path.json', { method: 'POST' });

      expect(response).toEqual({ status: 502 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does not retry a PATCH request on a 502 response', async function() {
      fetchSpy.and.returnValue(Promise.resolve({ status: 502 }));

      const response = await client.request('/some/path.json', { method: 'PATCH' });

      expect(response).toEqual({ status: 502 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does not retry a DELETE request on a 502 response', async function() {
      fetchSpy.and.returnValue(Promise.resolve({ status: 502 }));

      const response = await client.request('/some/path.json', { method: 'DELETE' });

      expect(response).toEqual({ status: 502 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does not retry a GET request when explicitly opted out with retry: false', async function() {
      fetchSpy.and.returnValue(Promise.resolve({ status: 502 }));

      const response = await client.request('/some/path.json', { retry: false });

      expect(response).toEqual({ status: 502 });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
