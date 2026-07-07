import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchCharacterFull', function() {
    it('requests the full endpoint with the auth token when present for a PC', async function() {
      const client = new CharacterClient();

      await client.fetchCharacterFull('pcs', 'demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/full.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token for a PC', async function() {
      const client = new CharacterClient();

      await client.fetchCharacterFull('pcs', 'demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/full.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('requests the full endpoint with the auth token when present for an NPC', async function() {
      const client = new CharacterClient();

      await client.fetchCharacterFull('npcs', 'demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/full.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token for an NPC', async function() {
      const client = new CharacterClient();

      await client.fetchCharacterFull('npcs', 'demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/full.json', {
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
