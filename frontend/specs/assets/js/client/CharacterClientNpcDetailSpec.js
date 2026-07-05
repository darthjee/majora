import CharacterClient from '../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient NPC detail requests', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchNpc', function() {
    it('sends the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchNpc('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchNpc('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchNpcFull', function() {
    it('requests the full endpoint with the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchNpcFull('demo', '2', 'abc123');

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

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchNpcFull('demo', '2', null);

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

  describe('#fetchNpcAccess', function() {
    it('requests the access endpoint with the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchNpcAccess('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchNpcAccess('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchNpcTreasures', function() {
    it('requests the treasures endpoint with the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchNpcTreasures('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchNpcTreasures('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
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
