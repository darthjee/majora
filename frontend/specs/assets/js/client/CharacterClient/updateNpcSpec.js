import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient NPC detail requests', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#updateNpc', function() {
    it('sends the fields and auth token when present', async function() {
      const client = new CharacterClient();

      await client.updateNpc('demo', '2', 'abc123', { name: 'Goblin King' });

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

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.updateNpc('demo', '2', null, { name: 'Goblin King' });

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
