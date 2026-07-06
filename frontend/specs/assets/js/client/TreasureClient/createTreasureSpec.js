import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#createTreasure', function() {
    it('sends a POST request with the fields and auth token when present', async function() {
      const client = new TreasureClient();

      await client.createTreasure('tok-abc', { name: 'Sword', value: 100 });

      expect(fetchSpy).toHaveBeenCalledWith('/treasures.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Sword', value: 100 }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.createTreasure(null, { name: 'Sword', value: 100 });

      expect(fetchSpy).toHaveBeenCalledWith('/treasures.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Sword', value: 100 }),
      });
    });
  });
});
