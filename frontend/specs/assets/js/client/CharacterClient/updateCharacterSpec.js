import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#updateCharacter', function() {
    it('sends the fields and auth token when present for a PC', async function() {
      const client = new CharacterClient();

      await client.updateCharacter('pcs', 'demo', '2', 'abc123', { name: 'Aragorn' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Aragorn' }),
      });
    });

    it('omits the Authorization header when there is no token for a PC', async function() {
      const client = new CharacterClient();

      await client.updateCharacter('pcs', 'demo', '2', null, { name: 'Aragorn' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Aragorn' }),
      });
    });

    it('sends the fields and auth token when present for an NPC', async function() {
      const client = new CharacterClient();

      await client.updateCharacter('npcs', 'demo', '2', 'abc123', { name: 'Goblin King' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Goblin King' }),
      });
    });

    it('omits the Authorization header when there is no token for an NPC', async function() {
      const client = new CharacterClient();

      await client.updateCharacter('npcs', 'demo', '2', null, { name: 'Goblin King' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Goblin King' }),
      });
    });
  });
});
