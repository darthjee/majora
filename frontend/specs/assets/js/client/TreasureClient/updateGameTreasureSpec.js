import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#updateGameTreasure', function() {
    it('sends a PATCH request with the fields and auth token when present', async function() {
      const client = new TreasureClient();

      await client.updateGameTreasure('demo', 42, 'tok-abc', { name: 'Golden Sword' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Golden Sword' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.updateGameTreasure('demo', 42, null, { name: 'Golden Sword' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Golden Sword' }),
      });
    });
  });
});
