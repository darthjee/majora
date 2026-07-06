import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
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
});
