import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#sellPcTreasure', function() {
    it('sends a POST request with the fields and auth token', async function() {
      const client = new CharacterClient();

      await client.sellPcTreasure('demo', '2', 'abc123', { treasure_id: 9, quantity: 1 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures/sell.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ treasure_id: 9, quantity: 1 }),
      });
    });
  });
});
