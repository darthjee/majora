import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchTreasureAccess', function() {
    it('sends the auth token and X-Skip-Cache header when present', async function() {
      const client = new TreasureClient();

      await client.fetchTreasureAccess(42, 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.fetchTreasureAccess(42, null);

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });
});
