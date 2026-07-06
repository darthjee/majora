import CharacterClient from '../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchPc', function() {
    it('sends the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchPc('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
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

      await client.fetchPc('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });

    it('does not send the X-Skip-Cache header', async function() {
      const client = new CharacterClient();

      await client.fetchPc('demo', '2', 'abc123');

      const [, options] = fetchSpy.calls.mostRecent().args;
      expect(options.headers['X-Skip-Cache']).toBeUndefined();
    });
  });

  describe('#fetchPcFull', function() {
    it('requests the full endpoint with the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchPcFull('demo', '2', 'abc123');

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

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchPcFull('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/full.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchPcAccess', function() {
    it('requests the access endpoint with the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchPcAccess('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json', {
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

      await client.fetchPcAccess('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchPcTreasures', function() {
    it('requests the treasures endpoint with the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchPcTreasures('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json', {
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

      await client.fetchPcTreasures('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchPcTreasuresPage', function() {
    it('requests the treasures endpoint with page and per_page query params', async function() {
      const client = new CharacterClient();

      await client.fetchPcTreasuresPage('demo', '2', 'abc123', { page: 2, perPage: 5 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json?page=2&per_page=5', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });

    it('omits query params when not provided', async function() {
      const client = new CharacterClient();

      await client.fetchPcTreasuresPage('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchNpcTreasuresPage', function() {
    it('requests the npc treasures endpoint with page and per_page query params', async function() {
      const client = new CharacterClient();

      await client.fetchNpcTreasuresPage('demo', '2', 'abc123', { page: 3, perPage: 10 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json?page=3&per_page=10', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('sends the X-Skip-Cache header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchNpcTreasuresPage('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });

  describe('#acquirePcTreasure', function() {
    it('sends a POST request with the fields and auth token', async function() {
      const client = new CharacterClient();

      await client.acquirePcTreasure('demo', '2', 'abc123', { treasure_id: 9, quantity: 3 });

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

  describe('#acquireNpcTreasure', function() {
    it('sends a POST request with the fields and auth token', async function() {
      const client = new CharacterClient();

      await client.acquireNpcTreasure('demo', '2', 'abc123', { treasure_id: 9, quantity: 3 });

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

  describe('#sellNpcTreasure', function() {
    it('sends a POST request with the fields and auth token', async function() {
      const client = new CharacterClient();

      await client.sellNpcTreasure('demo', '2', 'abc123', { treasure_id: 9, quantity: 1 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures/sell.json', {
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

  describe('#updatePc', function() {
    it('sends the fields and auth token when present', async function() {
      const client = new CharacterClient();

      await client.updatePc('demo', '2', 'abc123', { name: 'Aragorn' });

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

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.updatePc('demo', '2', null, { name: 'Aragorn' });

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
  });
});
