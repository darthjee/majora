import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
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
});
