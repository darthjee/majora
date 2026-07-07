import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#acquireTreasure', function() {
    it('sends a POST request with the fields and auth token for a PC', async function() {
      const client = new CharacterClient();

      await client.acquireTreasure('pcs', 'demo', '2', 'abc123', { treasure_id: 9, quantity: 3 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures/acquire.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ treasure_id: 9, quantity: 3 }),
      });
    });

    it('sends a POST request with the fields and auth token for an NPC', async function() {
      const client = new CharacterClient();

      await client.acquireTreasure('npcs', 'demo', '2', 'abc123', { treasure_id: 9, quantity: 3 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures/acquire.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ treasure_id: 9, quantity: 3 }),
      });
    });
  });
});
